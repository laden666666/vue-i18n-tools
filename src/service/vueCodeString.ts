import { parseHTML } from './vueCodeString/html-parser'
import {
    markString,
    interpolationMark,
    ExtractStringResult,
    ExtractString
} from './common'
import jsCodeString from './jsCodeString'

const filterAttrNames = ['v-for']


export type ExtractStringOptions = {
    startNo?: number,
    // 字符串过滤器
    filter?: {(string): boolean}
}

export default {
    
    /**
     * 从js代码中提取指定语言字符串
     * @param {string} jsCode 
     * @param {string} [language='Chinese'] 
     * @returns {ExtractJSStringResult} 
     */
    extractStringFromVue(jsCode: string, {filter = ()=> true, startNo = 0}: ExtractStringOptions = {}): ExtractStringResult{
        let extractStrings: ExtractString[] = []

        // 解析过程中jsCode源码长度变化
        let changeLength = 0

        // 当前标签的层级
        let level = 0

        // 顶级标签，对应vue的sfc文件的style、template、script、自定义标签等
        let topTagName: string

        parseHTML(jsCode, {
            start(tagName, attr, start, end){
                if(level === 0){
                    topTagName = tagName
                    level++
                } else if('template' === tagName && 'template' === topTagName){
                    level++
                }

                if(topTagName === 'template'){
                    attr.forEach(item=>{

                        // 如没有value，或者是忽略的属性，不处理
                        if(item.value && filterAttrNames.indexOf(item.name.toLowerCase()) === -1){

                            // 如果是v-、:、@开头的，表示是vue的绑定属性，需要做替换
                            if(item.name.match(/^[:@]|v-/)){
    
                                let prefixCode = item.code.split('=')[0]
                                let code = item.value
                                if('"' === item.quotationMarks){
                                    code = code.replace(/\\"/g, '"')
                                } else if("'" === item.quotationMarks){
                                    code = code.replace(/\\'/g, "'")
                                }

                                try{

                                    let result = jsCodeString.extractStringFromJS(code, {
                                        startNo: extractStrings.length,
                                        filter
                                    })
                                    if(result.extractString.length > 0) {
                                        let _extractStrings = []
                                        result.extractString.forEach((item, index) => {
                                            let extractString: ExtractString = {...item, type: 1}
                                            _extractStrings.push(extractString)
                                        })
    
                                        extractStrings = extractStrings.concat(_extractStrings)
                                        jsCode = jsCode.substr(0, item.start + changeLength) + prefixCode + '=' + item.quotationMarks 
                                            + result.result + item.quotationMarks + jsCode.substr(item.end + changeLength)
                                        changeLength += result.result.length - code.length
                                    }
                                } catch(e){
                                    console.warn(code, '\n',e)
                                }

                            } else if( item.name.match(/^[a-zA-Z_]+/g) && filter(item.value)) {
                                // 如果是用普通变量名开头，表示是非绑定字段，使用“:”重新绑定

                                let quotationMarks = item.quotationMarks == '"' ? "'" : '"'
                                let replaceCode = `${markString[0]}${extractStrings.length}${markString[1]}`
                                let extractString: ExtractString = {
                                    index: extractStrings.length,
                                    originalCode: item.code.trim(),
                                    replaceCode: `:${item.name}=${quotationMarks}${replaceCode}${quotationMarks}`,
                                    word: item.value,
                                    type: 1,
                                }

                                extractStrings.push(extractString)
                                jsCode = jsCode.substr(0, item.start + changeLength) + item.code.split(item.name[0])[0] + replaceCode + jsCode.substr(item.end + changeLength)
                                changeLength += replaceCode.length - extractString.originalCode.length 
                            }
                            // 非vue相关属性，工具不做处理
                        }
                    })
                }
            },
            chars(content, start: number, end: number){
                if(topTagName === 'template'){
                    // 剩余未解析内容
                    let last = content, 
                    // 每一次转换后的start的值
                    _start = start

                    while(last){
                        // 检测{{
                        let startIndex = last.indexOf('{{'),
                        // 本次处理的文本
                        code: string
                        if(startIndex === 0){
                            // 检测}}，如果没有就将整个content合成一个
                            let endIndex = last.indexOf('}}')

                            if(endIndex !== -1){
                                // 先取出{{}}部分的文本
                                code = last.substr(2, endIndex - 2)
                                last = last.substr(endIndex + 2)

                                try{

                                    let result = jsCodeString.extractStringFromJS(code, {
                                        startNo: extractStrings.length,
                                        filter
                                    })
    
                                    if(result.extractString.length > 0) {
                                        let _extractStrings = []
                                        result.extractString.forEach((item, index) => {
                                            let extractString: ExtractString = {...item, type: 2}
                                            _extractStrings.push(extractString)
                                        })
    
                                        extractStrings = extractStrings.concat(_extractStrings)
                                        jsCode = jsCode.substr(0, _start + changeLength) + '{{'
                                            + result.result + '}}' + jsCode.substr(_start + code.length + 4 + changeLength)
                                        changeLength += result.result.length - code.length
                                        _start += result.result.length + 3
                                    }
                                } catch(e){
                                    console.warn(code, '\n',e)
                                }

                                continue
                            }
                        } 
                        
                        if(startIndex > 0 && last.indexOf('}}') > -1){
                            // 将{{前的内容取出，封装成一个{{}}结构
                            code = last.substr(0, startIndex)
                            last = last.substr(startIndex)
                        } else {
                            code = last
                            last = ''
                        }

                        if(filter(code)){
                            let replaceCode = `${markString[0]}${extractStrings.length}${markString[1]}`

                            let extractString: ExtractString = {
                                index: extractStrings.length,
                                originalCode: code,
                                replaceCode: `{{${replaceCode}}}`,
                                word: code,
                                type: 2,
                            }
    
                            extractStrings.push(extractString)
                            jsCode = jsCode.substr(0, _start + changeLength) + replaceCode + jsCode.substr(_start + code.length + changeLength)
                            changeLength += replaceCode.length - extractString.originalCode.length
                            _start = _start + code.length
                        }
                        
                    }
                } else if(topTagName === 'script'){
                    let code = content

                    try{
                        let result = jsCodeString.extractStringFromJS(code, {
                            startNo: extractStrings.length,
                            filter
                        })
    
                        if(result.extractString.length > 0) {
                            let _extractStrings = []
                            result.extractString.forEach((item, index) => {
                                let extractString: ExtractString = item
                                _extractStrings.push(extractString)
                            })
    
                            extractStrings = extractStrings.concat(_extractStrings)
                            jsCode = jsCode.substr(0, start + changeLength) + result.result
                                + jsCode.substr(end + changeLength)
                            changeLength += result.result.length - code.length
                        }
                    } catch(e){
                        console.warn(code, '\n',e)
                    }

                    
                }
            },
            end(tagName){
                if(level === 1 && topTagName == tagName){
                    topTagName = undefined
                    level--
                } else if(level > 1 && 'template' === tagName && 'template' === topTagName){
                    level--
                }
            }
        })

        return {
            // 提取字符串后的
            result: jsCode,
            // 提取后的标记
            markString,
            // 字符串插值的标记
            interpolationMark,
            // 提取的结果
            extractString: extractStrings
        }
    }
}