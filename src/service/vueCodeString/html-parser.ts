const isNonPhrasingTag = makeMap(
    'address,article,aside,base,blockquote,body,caption,col,colgroup,dd,' +
    'details,dialog,div,dl,dt,fieldset,figcaption,figure,footer,form,' +
    'h1,h2,h3,h4,h5,h6,head,header,hgroup,hr,html,legend,li,menuitem,meta,' +
    'optgroup,option,param,rp,rt,source,style,summary,tbody,td,tfoot,th,thead,' +
    'title,tr,track'
)

export function makeMap (
    str: string,
    expectsLowerCase?: boolean
): (key: string) => true | void {
    const map = Object.create(null)
    const list: Array<string> = str.split(',')
    for (let i = 0; i < list.length; i++) {
      map[list[i]] = true
    }
    return expectsLowerCase
      ? val => map[val.toLowerCase()]
      : val => map[val]
}

// 
const no = (...arg: any[])=>false

// Regular Expressions for parsing tags and attributes
// 属性正在？？没看懂，大意应该是取出xx=yy中，取出xx、=、yy这三个值
// 其中yy这个值可能是带""或者''，要将"和'去除
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
// could use https://www.w3.org/TR/1999/REC-xml-names-19990114/#NT-QName
// but for Vue templates we can enforce a simple charset
// 根据w3c标准，出的标签名正则
const ncname = '[a-zA-Z_][\\w\\-\\.]*'
// 带命名空间的标签名正则
const qnameCapture = `((?:${ncname}\\:)?${ncname})`
// 开始标签正则
const startTagOpen = new RegExp(`^<${qnameCapture}`)

// 开始标签的结束正则
const startTagClose = /^\s*(\/?)>/

// 结束标签的正则
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`)

// 声明引用正则。[^>]？？？
const doctype = /^<!DOCTYPE [^>]+>/i
// #7298: escape - to avoid being pased as HTML comment when inlined in page
// 注释正则
const comment = /^<!\--/
// 注释正则
const conditionalComment = /^<!\[/

// 忽略script，style，textarea里面的内容
export const isPlainTextElement = makeMap('script,style,textarea', true)
const reCache = {}

// html转义
const decodingMap = {
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&amp;': '&',
    '&#10;': '\n',
    '&#9;': '\t'
}

// html转义正则。属性是否允许换行？？？难度属性还允许换行？？？
const encodedAttr = /&(?:lt|gt|quot|amp);/g
const encodedAttrWithNewLines = /&(?:lt|gt|quot|amp|#10|#9);/g

// #5992
const isIgnoreNewlineTag = makeMap('pre,textarea', true)
const shouldIgnoreFirstNewline = (tag, html) => tag && isIgnoreNewlineTag(tag) && html[0] === '\n'

type Attr = {
    name: string, 
    value: string,
    code: string,
    start: number,
    end: number,
    quotationMarks: string,
}

/**
 * 给属性值做html解码。在xml里面，属性值是要编码的，如1<2要编码成1&lt;2。但是vue的template是不需要。
 * 该函数是给编码的html做解码
 * 如果刚好属性值未做编码，但是包含&lt;这类字符串怎么处理？？？
 * @param {any} value                   属性值
 * @param {any} shouldDecodeNewlines    是否支持换行的转码
 * @returns 
 */
function decodeAttr (value, shouldDecodeNewlines) {
    const re = shouldDecodeNewlines ? encodedAttrWithNewLines : encodedAttr
    return value.replace(re, match => decodingMap[match])
}

type ParseHTMLOptions = {
    // 是否采用html规则，如p标签不能嵌入块标签等
    expectHTML?: boolean

    // 注释
    comment?: (str: string)=>void

    // 注释
    start?: (tagName: string, attrs: Attr[], start: number, end: number)=>void

    // 注释
    end?: (tagName: string, start: number, end: number)=>void

    // chars
    chars?: (str: string, start: number, end: number)=>void
}

/**
 * 核心函数，递归调用获取ast
 * @export
 * @param {any} html        html文档片段
 * @param {any} options     配置
 */
export function parseHTML (html: string, options: ParseHTMLOptions) {
    const stack: {tag: string, lowerCasedTag: string, attrs: Attr[]}[] = []
    // 是否采用html规则
    const expectHTML = options.expectHTML
    // 判断自闭合标签。i18n不做自闭和标签判断
    const isUnaryTag = no
    // 可以省略闭合标签。i18n需要做判断
    const canBeLeftOpenTag = makeMap(
        ''
    )

    // 当前解析到html第几个字符
    let index = 0
    // 用于循环的元素
    let last, 
    // 找到的标签
    lastTag

    // 循环递归获取html
    while (html) {
        last = html
        // Make sure we're not in a plaintext content element like script/style
        if (!lastTag || !isPlainTextElement(lastTag)) {
            // 没有上一级标签，或者上一级标签不为script/style这种不需要内容的元素

            // 寻找第一个<开发的索引，表示可以开始找标签
            let textEnd = html.indexOf('<')
            if (textEnd === 0) {
                // 以<开头

                // 判断是否是注释
                // 注意注释的匹配级别最高
                if (comment.test(html)) {
                    const commentEnd = html.indexOf('-->')

                    // 跳过
                    if (commentEnd >= 0) {
                        if(typeof options.comment === 'function'){
                            options.comment(html.substring(4, commentEnd))
                        }

                        // 越过注释
                        advance(commentEnd + 3)
                        
                        continue
                    } else {
                        // 未找到注释解释，抛错
                    }
                }

                // http://en.wikipedia.org/wiki/Conditional_comment#Downlevel-revealed_conditional_comment
                if (conditionalComment.test(html)) {
                    const conditionalEnd = html.indexOf(']>')

                    if (conditionalEnd >= 0) {
                        advance(conditionalEnd + 2)
                        continue
                    }
                }

                // Doctype:
                // 移除Doctype
                const doctypeMatch = html.match(doctype)
                if (doctypeMatch) {
                    advance(doctypeMatch[0].length)
                    continue
                }

                // End tag:
                // 先匹配结束标签，再匹配开始标签
                const endTagMatch = html.match(endTag)
                if (endTagMatch) {
                    const curIndex = index
                    advance(endTagMatch[0].length)
                    parseEndTag(endTagMatch[1], curIndex, index)
                    continue
                }

                // Start tag:
                const startTagMatch = parseStartTag()
                if (startTagMatch) {
                    handleStartTag(startTagMatch)
                    if (shouldIgnoreFirstNewline(startTagMatch.tagName, html)) {
                        advance(1)
                    }
                    continue
                }
            }

            let text, rest, next
            if (textEnd >= 0) {
                // 如果前面有非<的内容，表示是文本

                // 取出文本
                rest = html.slice(textEnd)
                while (
                    !endTag.test(rest) &&
                    !startTagOpen.test(rest) &&
                    !comment.test(rest) &&
                    !conditionalComment.test(rest)
                ) {
                    // < in plain text, be forgiving and treat it as text
                    next = rest.indexOf('<', 1)
                    if (next < 0) break
                    textEnd += next
                    rest = html.slice(textEnd)
                }
                text = html.substring(0, textEnd)
                advance(textEnd)
            }

            // 如果没有匹配到<，表示是一个字符串文本
            if (textEnd < 0) {
                text = html
                html = ''
                index += text.length
            }

            if (options.chars && text) {
                options.chars(text, index - text.length, index)
            }
        } else {
            // 上一级是script等标签
            let endTagLength = 0
            const stackedTag = lastTag.toLowerCase()
            const reStackedTag = reCache[stackedTag] || (reCache[stackedTag] = new RegExp('([\\s\\S]*?)(</' + stackedTag + '[^>]*>)', 'i'))
            const rest = html.replace(reStackedTag, function (all, text, endTag) {
                endTagLength = endTag.length
                if (!isPlainTextElement(stackedTag) && stackedTag !== 'noscript') {
                    text = text
                        .replace(/<!\--([\s\S]*?)-->/g, '$1') // #7298
                        .replace(/<!\[CDATA\[([\s\S]*?)]]>/g, '$1')
                }
                if (shouldIgnoreFirstNewline(stackedTag, text)) {
                    text = text.slice(1)
                }
                if (options.chars) {
                    options.chars(text, index, index + text.length)
                }
                return ''
            })
            index += html.length - rest.length
            html = rest
            parseEndTag(stackedTag, index - endTagLength, index)
        }

        if (html === last) {

            options.chars && options.chars(html, index, index + html.length)
            break
        }
    }

    // Clean up any remaining tags
    parseEndTag()

    // 向后html截取n个字符
    function advance (n) {
        index += n
        html = html.substring(n)
    }

    function parseStartTag () {
        const start = html.match(startTagOpen)
        if (start) {
            const match:{
                tagName: string,
                unarySlash?: boolean,
                attrs: {array: RegExpMatchArray, start: number, end: number}[],
                start: number,
                end?: number,
            } = {
                tagName: start[1],
                attrs: [],
                start: index
            }
            advance(start[0].length)
            let end, attr: RegExpMatchArray
            while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
                let start = index
                advance(attr[0].length)
                let end = index
                match.attrs.push({
                    array: attr,
                    start,
                    end,
                })
            }
            if (end) {
                match.unarySlash = end[1]
                advance(end[0].length)
                match.end = index
                return match
            }
        }
    }

    // 处理匹配到的开始标签
    function handleStartTag (match: {
        tagName: string,
        unarySlash?: boolean,
        attrs?: {array: RegExpMatchArray, start: number, end: number}[],
        start?: number,
        end?: number,
    }) {
        const tagName = match.tagName
        const unarySlash = match.unarySlash

        if (expectHTML) {
            if (lastTag === 'p' && isNonPhrasingTag(tagName)) {
                parseEndTag(lastTag)
            }
            if (canBeLeftOpenTag(tagName) && lastTag === tagName) {
                parseEndTag(tagName)
            }
        }

        const unary = isUnaryTag(tagName) || !!unarySlash

        const l = match.attrs.length
        const attrs = new Array<Attr>(l)
        // 取出属性
        for (let i = 0; i < l; i++) {
            const args = match.attrs[i].array
            const value = args[3] || args[4] || args[5] || ''
            let quotationMarks = ''
            if(args[3]){
                quotationMarks = '"'
            } else if(args[4]){
                quotationMarks = '\''
            }
            const shouldDecodeNewlines = true
            attrs[i] = {
                code: args[0],
                name: args[1],
                start: match.attrs[i].start,
                end: match.attrs[i].end,
                value: decodeAttr(value, shouldDecodeNewlines),
                quotationMarks
            }
        }

        if (!unary) {
            stack.push({ tag: tagName, lowerCasedTag: tagName.toLowerCase(), attrs: attrs })
            lastTag = tagName
        }

        if (options.start) {
            options.start(tagName, attrs, match.start, match.end)
        }
    }

    /**
     * 处理结束标签
     * @param {any} [tagName] 
     * @param {any} [start] 
     * @param {any} [end] 
     */
    function parseEndTag (tagName?: string, start?: number, end?: number) {
        let pos, lowerCasedTagName
        if (start == null) start = index
        if (end == null) end = index

        // Find the closest opened tag of the same type
        if (tagName) {
            lowerCasedTagName = tagName.toLowerCase()
            for (pos = stack.length - 1; pos >= 0; pos--) {
                if (stack[pos].lowerCasedTag === lowerCasedTagName) {
                    break
                }
            }
        } else {
            // If no tag name is provided, clean shop
            pos = 0
        }

        if (pos >= 0) {
            // Close all the open elements, up the stack
            for (let i = stack.length - 1; i >= pos; i--) {
                if (options.end) {
                    // i == pos，判断如果是自动补充结束标签的，用start做end位置
                    options.end(stack[i].tag, start, i == pos ? end : start)
                }
            }

            // Remove the open elements from the stack
            stack.length = pos
            lastTag = pos && stack[pos - 1].tag
        } else if (lowerCasedTagName === 'br') {
            if (options.start) {
                options.start(tagName, [], start, end)
            }
        } else if (lowerCasedTagName === 'p') {
            if (options.start) {
                options.start(tagName, [], start, end)
            }
            if (options.end) {
                options.end(tagName, start, end)
            }
        }
    }
}
