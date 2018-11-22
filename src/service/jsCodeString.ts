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

const markString = "-|||{}|||-"

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
    extractStringFromJS(jsCode: string, language: string = 'Chinese'): ExtractJSStringResult{
        return {
            result: jsCode,
            markString: '1',
            extractString: []
        }
    }
}