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

        // 提取字符串后的文本
        let result = {
            result: '',
            markString: markString,
            extractString: []
        }
        let isStringInside = false
        let stringBeginChart = null
        let extractingString = ''
        for(let i = 0; i < jsCode.length; i++){
            if(!isStringInside){
                if('\'' === jsCode[i] || '"' === jsCode[i] || '`' === jsCode[i]){
                    isStringInside = true
                    stringBeginChart = jsCode[i]
                    extractingString = ''
                } else {
                    result.result += jsCode[i]
                }
            } else{
                if('`' === stringBeginChart){

                } else if(stringBeginChart === jsCode[i] && '\\' !== jsCode[i - 1]){
                    result.result += result.markString[0] + result.extractString.length + result.markString[1]
                    result.extractString.push(eval(stringBeginChart + extractingString + stringBeginChart))
                    isStringInside = false
                    stringBeginChart = null
                } else {
                    extractingString += jsCode[i]
                }
            }
        }

        return result
    }
}