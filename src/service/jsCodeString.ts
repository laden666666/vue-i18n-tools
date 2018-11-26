import { ExtractJSStringResult } from '../model/ExtractJSStringResult';
// 注册的检测文本语言的函数map，用于检测指定文本是否是使用了指定语言的字符
let checkLanguageMap: {[languageName: string]: (strubg)=> boolean} = {
    Chinese: (stringCode)=>{
        return /[\u4e00-\u9fa5]/g.test(stringCode)
    },
    All: ()=>{
        return true
    }
}

// 标记的符号
const markString: [string, string] = ['-||', '||-']
// 标记的符号
const interpolationMark: [string, string] = ['%||', '||%']

/**
 * 从js代码中扫描字符串
 * @param {string} jsCode 
 * @param {number} startIndex 
 * @param {string} processedString 
 * @param {string[]} scanStringList 
 * @returns {string} 
 */
function scanStringFromJSCode(jsCode: string, startIndex: number, processedString: string, scanStringList: string[]): {
    endIndex: number,
    result: string,
}{
    // 提取字符串后的文本
    let result = processedString

    for(let i = startIndex; i < jsCode.length; i++){
        // 如果当前索引未在字符串内部，检测出字符串的开始字符，
        if('\'' === jsCode[i] || '"' === jsCode[i] || '`' === jsCode[i]) {
            let _result = extractString(jsCode, i, result, scanStringList)
            result = _result.result
            i = _result.endIndex
        } else if('}' === jsCode[i]) {
            result += interpolationMark[1]
            return {
                result,
                endIndex: i
            }
        } else {
            // 未进入字符串收集字符串
            result += jsCode[i]
        }
    }

    return {
        result,
        endIndex: jsCode.length - 1
    }
}

/**
 * 从js代码中提取字符串
 * @param {string} jsCode           js代码
 * @param {number} startIndex       提取字符串的开始位置
 * @returns {{
 *     endIndex: number,
 *     result: string
 * }} 
 */
function extractString(jsCode: string, startIndex: number, processedString: string, scanStringList: string[]): {
    endIndex: number,
    result: string,
}{
    if('\'' !== jsCode[startIndex] && '"' !== jsCode[startIndex] && '`' !== jsCode[startIndex]) {
        throw new Error('')
    }

    // 如果当前索引在字符串内部，则定义字符串的字符是什么（' " `中的一个）
    let stringBeginChar = jsCode[startIndex]
    // 如果当前索引在字符串内部，则已经收集的字符串文本
    let extractingString = ''
    // 检索的索引
    let i: number
    let scanStringListLength = scanStringList.length
    let hasSubStringCount = 0

    processedString += markString[0] + scanStringListLength
    scanStringList.push('')
    for(i = startIndex + 1; i < jsCode.length; i++){

        // 当索引已经进入字符串中时候，检查字符串结束字符
        if('`' === stringBeginChar && '$' === jsCode[i] && '{' === jsCode[i + 1 ] 
            && ('\\' !== jsCode[i - 1] || '\\' === jsCode[i - 1] && '\\' === jsCode[i - 2])){
            // 如果是es6的模板字符串，要求先检查是否存在$，如果存在递归查找所有字符串
            let _result = scanStringFromJSCode(jsCode, i + 2, processedString + interpolationMark[0], scanStringList)
            i = _result.endIndex
            processedString = _result.result
            extractingString += '{' + hasSubStringCount + '}' 
            hasSubStringCount++
        } else if(stringBeginChar === jsCode[i]
            && ('\\' !== jsCode[i - 1] || '\\' === jsCode[i - 1] && '\\' === jsCode[i - 2])){

            processedString += hasSubStringCount ? scanStringListLength + markString[1] : markString[1]
            scanStringList[scanStringListLength] = eval(stringBeginChar + extractingString + stringBeginChar)
            
            return {
                result: processedString,
                endIndex: i
            }
        } else {
            extractingString += jsCode[i]
        }
    }
}


export default {
    
    /**
     * 检测是该文本是否是语言的文本
     * @param {string} stringCode               需要检测的语言
     * @param {string} [language='Chinese']     指定的语言
     * @returns {boolean}                       该文本是否是指定的语言
     */
    checkHasLanguage(stringCode: string, language: string = 'Chinese'): boolean{
        if(!checkLanguageMap[language]){
            throw new Error(`Language not supported: ${language}`)
        }
        return checkLanguageMap[language](stringCode)
    },

    /**
     * 从js代码中提取指定语言字符串
     * @param {string} jsCode 
     * @param {string} [language='Chinese'] 
     * @returns {ExtractJSStringResult} 
     */
    extractStringFromJS(jsCode: string, language: string = 'Chinese'): ExtractJSStringResult{

        let extractString = []
        let resultString = scanStringFromJSCode(jsCode, 0, '', extractString)

        return {
            result: resultString.result,
            markString: markString,
            interpolationMark: interpolationMark,
            extractString,
        }
    }
}