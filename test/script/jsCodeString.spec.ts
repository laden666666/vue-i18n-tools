import jsCodeString from '../../src/service/jsCodeString'
import * as chai from 'chai'
let assert = chai.assert

describe('测试检测文本', ()=>{

    // it('测试检测中文', ()=>{
        
            // // 注册的检测文本语言的函数map，用于检测指定文本是否是使用了指定语言的字符
            // let checkLanguageMap: {[languageName: string]: (strubg)=> boolean} = {
            //     Chinese: (stringCode)=>{
            //         return /[\u4e00-\u9fa5]/g.test(stringCode)
            //     },
            //     All: ()=>{
            //         return true
            //     }
            // }
    //     assert.equal(jsCodeString.checkHasLanguage('中文'), true)
    // })

    it('从js代码中提取字符串', ()=>{
        let result = jsCodeString.extractStringFromJS(`var str = "嘻嘻嘻"`)
        assert.equal(result.result, 'var str = ' + result.markString[0] + '0' + result.markString[1])
        assert.deepEqual(result.extractString.map(item=> item.word), ['嘻嘻嘻'])
        assert.deepEqual(result.extractString.map(item=> item.originalCode), [`"嘻嘻嘻"`])
        
        result = jsCodeString.extractStringFromJS(`var str = "嘻\\"嘻嘻"
var str = '鼎折\\'覆餗'`)
        assert.equal(result.result, 'var str = ' + result.markString[0] + '0' + result.markString[1] 
            + '\nvar str = ' + result.markString[0] + '1' + result.markString[1])
        assert.deepEqual(result.extractString.map(item=> item.word), ['嘻"嘻嘻', '鼎折\'覆餗'])
        assert.deepEqual(result.extractString.map(item=> item.originalCode), [`"嘻\\"嘻嘻"`, `'鼎折\\'覆餗'`])
        
        result = jsCodeString.extractStringFromJS(`var str = "嘻\\\\";
var str = '鼎折\\'覆餗'`)
        assert.equal(result.result, 'var str = ' + result.markString[0] + '0' + result.markString[1] 
            + ';\nvar str = ' + result.markString[0] + '1' + result.markString[1])
        assert.deepEqual(result.extractString.map(item=> item.word), ['嘻\\', '鼎折\'覆餗'])
        assert.deepEqual(result.extractString.map(item=> item.originalCode), [`"嘻\\\\"`, `'鼎折\\'覆餗'`])
    })
    
    it('有filter的从js代码中提取字符串', ()=>{
        let result = jsCodeString.extractStringFromJS(`var str = "嘻嘻嘻"`, {filter: str=>false})
        assert.equal(result.result, `var str = "嘻嘻嘻"`)
        assert.deepEqual(result.extractString.map(item=> item.word), [])
        
        result = jsCodeString.extractStringFromJS(`var str = "嘻\\"嘻嘻"
var str = '鼎折\\'覆餗'`, {filter: str=>str == `鼎折'覆餗`})
        assert.equal(result.result, 'var str = "嘻\\"嘻嘻"'
            + '\nvar str = ' + result.markString[0] + '0' + result.markString[1])
        assert.deepEqual(result.extractString.map(item=> item.word), ['鼎折\'覆餗'])
    })

    it('从js代码中提取模板字符串', ()=>{
        let result = jsCodeString.extractStringFromJS(`var str = \`嘻嘻\n嘻\``)
        assert.equal(result.result, 'var str = ' + result.markString[0] + '0' + result.markString[1])
        assert.deepEqual(result.extractString.map(item=> item.word), ['嘻嘻\n嘻'])
        assert.deepEqual(result.extractString.map(item=> item.originalCode), [`\`嘻嘻\n嘻\``])
        
        result = jsCodeString.extractStringFromJS(`var str = \`嘻嘻\\\${1}嘻\``)
        assert.equal(result.result, 'var str = ' + result.markString[0] + '0' + result.markString[1])
        assert.deepEqual(result.extractString.map(item=> item.word), ['嘻嘻${1}嘻'])
        assert.deepEqual(result.extractString.map(item=> item.originalCode), [`\`嘻嘻\\\${1}嘻\``])
        
        result = jsCodeString.extractStringFromJS(`var str = \`嘻嘻\${1}嘻\``)
        assert.equal(result.result, 'var str = -||0%||1||%0||-')
        assert.deepEqual(result.extractString.map(item=> item.word), ['嘻嘻{0}嘻'])
        assert.deepEqual(result.extractString.map(item=> item.originalCode), [`\`嘻嘻\${1}嘻\``])

        result = jsCodeString.extractStringFromJS(`var str = \`嘻\${0}嘻\${1}嘻\``)
        assert.equal(result.result, 'var str = -||0%||0||%0%||1||%0||-')
        assert.deepEqual(result.extractString.map(item=> item.word), ['嘻{0}嘻{1}嘻'])
        assert.deepEqual(result.extractString.map(item=> item.originalCode), [`\`嘻\${0}嘻\${1}嘻\``])
        
        result = jsCodeString.extractStringFromJS('var str = `嘻嘻${ "水电费" + `放到${2 + 1}地方` }嘻`')
        assert.equal(result.result, 'var str = -||0%|| -||1||- + -||2%||2 + 1||%2||- ||%0||-')
        assert.deepEqual(result.extractString.map(item=> item.word), ['嘻嘻{0}嘻', '水电费', '放到{0}地方'])
        assert.deepEqual(result.extractString.map(item=> item.originalCode), [
            '`嘻嘻${ -||1||- + -||2%||2 + 1||%2||- }嘻`',
            '"水电费"',
            '`放到${2 + 1}地方`',
        ])
        
        result = jsCodeString.extractStringFromJS('var str = `嘻嘻${ "水电费" + `放到${2 + 1}地方` }嘻${1}`')
        assert.equal(result.result, 'var str = -||0%|| -||1||- + -||2%||2 + 1||%2||- ||%0%||1||%0||-')
        assert.deepEqual(result.extractString.map(item=> item.word), ['嘻嘻{0}嘻{1}', '水电费', '放到{0}地方'])
        assert.deepEqual(result.extractString.map(item=> item.originalCode), [
            '`嘻嘻${ -||1||- + -||2%||2 + 1||%2||- }嘻${1}`',
            '"水电费"',
            '`放到${2 + 1}地方`',
        ])
    })

    it('有filter的从js代码中提取模板字符串', ()=>{
        let result = jsCodeString.extractStringFromJS(`var str = \`嘻嘻\n嘻\``, {filter: ()=> false})
        assert.equal(result.result, `var str = \`嘻嘻\n嘻\``)
        assert.deepEqual(result.extractString.map(item=> item.word), [])
        
        result = jsCodeString.extractStringFromJS(`var str = \`嘻嘻\\\${1}嘻\``, {filter: ()=> false})
        assert.equal(result.result, `var str = \`嘻嘻\\\${1}嘻\``)
        assert.deepEqual(result.extractString.map(item=> item.word), [])
        
        result = jsCodeString.extractStringFromJS('var str = `嘻嘻${ "水电费" + `放到${2 + 1}地方` }嘻`', {
            filter: str=> str.indexOf('嘻') > -1
        })
        assert.equal(result.result, 'var str = -||0%|| "水电费" + `放到${2 + 1}地方` ||%0||-')
        assert.deepEqual(result.extractString.map(item=> item.word), ['嘻嘻{0}嘻'])
        
        result = jsCodeString.extractStringFromJS('var str = `嘻嘻${ "水电费" + `放到${2 + 1}地方` }嘻`', {
            filter: str=> str.indexOf('嘻') === -1
        })
        assert.equal(result.result, 'var str = `嘻嘻${ -||0||- + -||1%||2 + 1||%1||- }嘻`')
        assert.deepEqual(result.extractString.map(item=> item.word), ['水电费', '放到{0}地方'])
        
        result = jsCodeString.extractStringFromJS('var str = `嘻嘻${ "水电费" + `放到${2 + 1}地方` }嘻`', {
            filter: str=> str != '水电费'
        })
        assert.equal(result.result, 'var str = -||0%|| "水电费" + -||1%||2 + 1||%1||- ||%0||-')
        assert.deepEqual(result.extractString.map(item=> item.word), ['嘻嘻{0}嘻', '放到{0}地方'])
        
        result = jsCodeString.extractStringFromJS('var str = `大大${ "水电费" + `放到${2 + 1}地方` }嘻${1}`', {
            filter: str=> str.indexOf('嘻') > -1
        })
        assert.equal(result.result, 'var str = -||0%|| "水电费" + `放到${2 + 1}地方` ||%0%||1||%0||-')
        assert.deepEqual(result.extractString.map(item=> item.word), ['大大{0}嘻{1}'])
    })


    it('测试注释', ()=>{
        let result = jsCodeString.extractStringFromJS(`var str = \`嘻嘻\n嘻\` //'test'`)
        assert.equal(result.result, 'var str = ' + result.markString[0] + '0' + result.markString[1] + ` //'test'`)
        assert.deepEqual(result.extractString.map(item=> item.word), ['嘻嘻\n嘻'])

        result = jsCodeString.extractStringFromJS(`var str = /*'test'*/ \`嘻嘻\n嘻\``)
        assert.equal(result.result, 'var str = /*\'test\'*/ ' + result.markString[0] + '0' + result.markString[1])
        assert.deepEqual(result.extractString.map(item=> item.word), ['嘻嘻\n嘻'])
    })

    it('测试正则', ()=>{
        let result = jsCodeString.extractStringFromJS(`var str = /'你'/ //'test'`)
        assert.equal(result.result, "var str = /'你'/ //'test'")
        assert.deepEqual(result.extractString.map(item=> item.word), [])

        result = jsCodeString.extractStringFromJS('var g, test = 1+/1+`你`+1/g')
        assert.equal(result.result, "var g, test = 1+/1+`你`+1/g")
        assert.deepEqual(result.extractString.map(item=> item.word), [])

        result = jsCodeString.extractStringFromJS('var g, test = 1/1+`你`+1/g')
        assert.equal(result.result, "var g, test = 1/1+" + result.markString[0] + 0 + result.markString[1] + "+1/g")
        assert.deepEqual(result.extractString.map(item=> item.word), [`你`])
    })

    it('单字符串', ()=>{
        let result = jsCodeString.extractStringFromJS(`"嘻嘻嘻"`)
        assert.equal(result.result, result.markString[0] + '0' + result.markString[1])
        assert.deepEqual(result.extractString.map(item=> item.word), ['嘻嘻嘻'])
        
    })

    it('忽略掉模化的字符串', ()=>{
        let result = jsCodeString.extractStringFromJS(`import test from 'test'`)
        assert.equal(result.result, "import test from 'test'")
        assert.deepEqual(result.extractString.map(item=> item.word), [])
    })

    it('转换配置——startNo', ()=>{
        let result = jsCodeString.extractStringFromJS(`var str = "嘻嘻嘻"`, {startNo: 1})
        assert.equal(result.result, 'var str = ' + result.markString[0] + '1' + result.markString[1])
        assert.deepEqual(result.extractString.map(item=> item.word), ['嘻嘻嘻'])
    })
})