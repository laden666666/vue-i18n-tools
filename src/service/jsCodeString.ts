import {
    parse
} from '@babel/parser';
import {
    StringLiteral,
    TemplateLiteral,
    DirectiveLiteral
} from '@babel/types';
import {
    markString,
    interpolationMark,
    ExtractStringResult,
    ExtractString
} from './common'

// 扩展TemplateLiteral，因为TemplateLiteral里面的部分属性，@babel/types未收录
declare module '@babel/types' {
    interface TemplateLiteral{
        value?: {cooked: string, raw: any}
    }
}

/**
 * 从babelAST树过滤后的字符串类型。TemplateLiteral[]表示是一个模板字符串
 */
type StringASTType = StringLiteral | DirectiveLiteral | TemplateLiteral | TemplateLiteral[]

/**
 * SortASTItem中普通字符串和没有${}的字符串模板
 */
type SortStringASTlItem = {
    // 收集字符串的序号
    index: number
    type: 'String'
    item: StringLiteral | TemplateLiteral | DirectiveLiteral
}

/**
 * SortASTItem字符串模板中${}的部分
 */
type SortTemplateQuasisASTItem = {
    // 收集字符串的序号
    index: number
    type: 'TemplateQuasis'
    item: TemplateLiteral
    first: boolean
    last: boolean
    value: string
}

/**
 * 用于排序的访问对象
 */
type SortASTItem = SortTemplateQuasisASTItem | SortStringASTlItem

/**
 * 使用babel的parse，找出模板中所用字符串，并按照其出现在code里面的位置排序
 * @param {string} code 
 * @returns {SortASTItem[]} 
 */
function extractStringFromJSCode(code: string, filter: {(str: string): boolean}): SortASTItem[]{
    let result = parse(code, {
        allowAwaitOutsideFunction: true,
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
        allowSuperOutsideMethod: true,
    })

    // 去除code里面所有字符串的ast的集合
    let stringList: StringASTType[] = []
    extractStringFromBabelAST(result.program, stringList, filter)

    // 排序字符串，并将字符串封装为sortASTList对象
    let sortASTList : SortASTItem[] = []
    stringList.forEach((ast, index)=>{
        if(Array.isArray(ast)){
            // 是数组表示是带插值的模板字符串，特殊对待，将其封装为自定义的SortTemplateQuasisASTItem对象
            let value = ast.reduce((value, item, index)=>{
                // 将多个模板字符串用插入赋表示，如果`test${'xxx'},${'yyy'}`改为'test{0},{1}'，这样xxx和yyy可以插入到对应的{}中
                if(index < ast.length - 1){
                    return value + item.value.raw + `{${index}}`
                } else {
                    return value + item.value.raw
                }
            }, '')

            ast.map((astItem, i)=>{
                sortASTList.push({
                    index,
                    type: 'TemplateQuasis',
                    item: astItem,
                    first: i == 0,
                    last: i == ast.length - 1,
                    value: value
                })
            })
        } else {
            // 如果不是数组，表示是字符串字面量或者是不带插值的模板字符串字面量
            sortASTList.push({
                index,
                type: 'String',
                item: ast
            })
        }
    })

    sortASTList.sort((item1, item2)=>item1.item.start - item2.item.start)
    return sortASTList
}

/**
 * 递归将ast树中的字符串取出，放到stringList里面
 * @param {*} ast                       ast树
 * @param {StringASTType[]} stringList  保存字符串
 */
function extractStringFromBabelAST(ast: any, stringList: StringASTType[], filter: {(str: string): boolean}){

    if('ImportDeclaration' === ast.type ){
        // 忽略一些语法中的字符串，如Import中的路径
        return
    } else if('StringLiteral' === ast.type || 'DirectiveLiteral' === ast.type ){
        let _ast: StringLiteral = ast
        if(filter(_ast.value)){
            stringList.push(ast)
        }
    } else if('TemplateLiteral' === ast.type){
        // 对于模板字符串要特殊处理，如果起包含插值（expressions），每个插值在分别遍历
        if(ast.expressions && ast.expressions.length && ast.quasis.length > 1){
            if(ast.quasis.some((_ast: TemplateLiteral)=>{
                return filter(_ast.value.cooked)
            })){
                stringList.push(ast.quasis)
                ast.expressions.forEach(item=> extractStringFromBabelAST(item, stringList, filter))
            } else {
                ast.expressions.forEach(item=> extractStringFromBabelAST(item, stringList, filter))
            }
        } else {
            let _ast: TemplateLiteral = ast
            if(filter(_ast.quasis[0].value.cooked)){
                stringList.push(_ast.quasis[0] as any)
            }
        }
    } else if(Array.isArray(ast)){
        // 如果是ast树的数组，逐个递归
        ast.forEach(item=>extractStringFromBabelAST(item, stringList, filter))
    } else {
        // 对于非模板字符串和普通字符串的类型，检查其各个对象，看是否包含子ast树或者数组
        // 这主要是每种类型分别处理难度太大，因此逐个字段遍历，效率低但是无需知晓每一种ast类型的细节
        let keys = Object.keys(ast)
        keys.forEach(key=>{
            if(ast[key] && ast[key].type || Array.isArray(ast[key])){
                extractStringFromBabelAST(ast[key], stringList, filter)
            }
        })
    }
}

/**
 * extractStringFromJS配置项
 */
export type ExtractStringOptions = {
    // 从多少开始计数
    startNo?: number,
    // 字符串过滤器
    filter?: {(string): boolean}
}

export default {

    /**
     * 从js代码中提取指定语言字符串
     * @param {string} jsCode 
     * @param {ExtractStringOptions} [{filter = ()=> true, startNo = 0}={}] 
     * @returns {ExtractJSStringResult} 
     */
    extractStringFromJS(jsCode: string, {filter = ()=> true, startNo = 0}: ExtractStringOptions = {}): ExtractStringResult{
        
        // 收集的导出字符串
        let extractString: ExtractString[] = []
        // 排序好的SortASTItem数组
        let stringASTList = extractStringFromJSCode(jsCode, filter)
        // jsCode改变的长度，用于下一次替换做补偿
        let codeLengthChange = 0
        // 缓存模板字符串的map
        let cacheTemplateMap: {[index: number]: {
            start: number,
            index: number,
            originalCode: string[],
            extractString: ExtractString
        }} = {}

        stringASTList.forEach(item=>{
            if(item.type == 'String'){
                // 普通字符串和没有插值的模板字符串用-||index||-，占位

                // 替换步骤：
                // 1.生成替换的字符串replaceString（-||index||-）
                // 2.将replaceString替换到jsCode中
                // 3.计算jsCode改变的长度，用于下一次替换做补偿
                // 4.将原始字符串压入extractString栈，进行下一次替换
                let start = item.item.start + codeLengthChange,
                    end = item.item.end + codeLengthChange,
                    index = (startNo + item.index)

                if('StringLiteral' == item.item.type || 'DirectiveLiteral' == item.item.type){
                    
                    let replaceString = markString[0] + index + markString[1]
                    extractString.push({
                        index,
                        replaceCode: replaceString,
                        originalCode: jsCode.substring(start, end) ,
                        word: item.item.value,
                        type: 'string',
                        replaceType: 'js',
                    })
                    jsCode = jsCode.substring(0, start) +  replaceString + jsCode.substring(end)
                    codeLengthChange += item.item.start - item.item.end + replaceString.length 
                } else {
                    start = start - 1
                    end = end + 1

                    let replaceString = markString[0] + index + markString[1]
                    extractString.push({
                        index,
                        replaceCode: replaceString,
                        originalCode: jsCode.substring(start, end) ,
                        word: item.item.value.cooked,
                        type: 'string',
                        replaceType: 'js',
                    })
                    jsCode = jsCode.substring(0, start) +  replaceString + jsCode.substring(end)
                    codeLengthChange += item.item.start - item.item.end - 2 + replaceString.length 
                }
                
            } else if('TemplateQuasis' == item.type) {
                // 有插值的模板字符串用-||index%||。。||%index||-占位，其中%||。。||%是${。。}的占项，。。指${。。}插入的值
                // 如模板字符串 `xxx${'yy'}zz`，不检出成-||0%||-||1||-||%0||-，0和1分别是xxx{0}zz和yy
                let index = (startNo + item.index)
                
                if(item.first){
                    let replaceString = markString[0] + index + interpolationMark[0]
                    let originalCode = jsCode.substring(item.item.start - 1 + codeLengthChange, item.item.end + 2 + codeLengthChange)
                    jsCode = jsCode.substring(0, item.item.start - 1 + codeLengthChange) +  replaceString + jsCode.substring(item.item.end + 2 + codeLengthChange)
                    
                    cacheTemplateMap[index] = {
                        start: item.item.start + codeLengthChange - 1,
                        index: index,
                        originalCode: [originalCode],
                        extractString: {
                            index: index,
                            replaceCode: '',
                            originalCode: '',
                            word: item.value,
                            type: 'template',
                            replaceType: 'js',
                        }
                    }
                    codeLengthChange += item.item.start - item.item.end - 3 + replaceString.length 

                    extractString.push(cacheTemplateMap[index].extractString)
                    jsCode = jsCode

                } else if(item.last){
                    let replaceString = interpolationMark[1] + index + markString[1]
                    let originalCode = jsCode.substring(item.item.start - 1 + codeLengthChange, item.item.end + 1 + codeLengthChange)
                    cacheTemplateMap[index].originalCode.push(originalCode)

                    jsCode = jsCode.substring(0, item.item.start - 1 + codeLengthChange) +  replaceString + jsCode.substring(item.item.end + 1 + codeLengthChange)
                    
                    // 修正replaceCode和originalCode
                    let replaceCode = jsCode.substring(cacheTemplateMap[index].start, item.item.start - 1 + codeLengthChange + replaceString.length)
                    let _originalCode = cacheTemplateMap[index].originalCode.reduce((code, item, i, arr)=>{
                        if(i === 0){
                            return code.replace(markString[0] + index + interpolationMark[0], item)
                        } 
                        if(i === arr.length - 1){
                            return code.replace(interpolationMark[1] + index + markString[1], item)
                        }
                        return code.replace(interpolationMark[1] + index + interpolationMark[0], item)
                    }, replaceCode)
                    cacheTemplateMap[index].extractString.originalCode = _originalCode
                    cacheTemplateMap[index].extractString.replaceCode = replaceCode

                    delete cacheTemplateMap[index]

                    codeLengthChange += item.item.start - item.item.end - 2 + replaceString.length 
                } else {
                    let replaceString = interpolationMark[1] + index + interpolationMark[0]
                    let originalCode = jsCode.substring(item.item.start - 1 + codeLengthChange, item.item.end + 2 + codeLengthChange)
                    cacheTemplateMap[index].originalCode.push(originalCode)

                    jsCode = jsCode.substring(0, item.item.start - 1 + codeLengthChange) +  replaceString + jsCode.substring(item.item.end + 2 + codeLengthChange)
                    codeLengthChange += item.item.start - item.item.end - 3 + replaceString.length 
                    jsCode = jsCode
                }
            }
        })

        return {
            result: jsCode,
            markString: markString,
            interpolationMark: interpolationMark,
            extractString: extractString,
        }
    }
}