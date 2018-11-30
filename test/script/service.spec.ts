import jsCodeString from '../../src/service/jsCodeString'
import * as chai from 'chai'
let assert = chai.assert

describe('测试检测文本', ()=>{

    it('测试检测中文', ()=>{
        assert.equal(jsCodeString.checkHasLanguage('中文'), true)
    })

    it('从js代码中提取字符串', ()=>{
        let result = jsCodeString.extractStringFromJS(`var str = "嘻嘻嘻"`)
        assert.equal(result.result, 'var str = ' + result.markString[0] + '0' + result.markString[1])
        assert.deepEqual(result.extractString, ['嘻嘻嘻'])
        
        result = jsCodeString.extractStringFromJS(`var str = "嘻\\"嘻嘻"
var str = '鼎折\\'覆餗'`)
        assert.equal(result.result, 'var str = ' + result.markString[0] + '0' + result.markString[1] 
            + '\nvar str = ' + result.markString[0] + '1' + result.markString[1])
        assert.deepEqual(result.extractString, ['嘻"嘻嘻', '鼎折\'覆餗'])
        
        result = jsCodeString.extractStringFromJS(`var str = "嘻\\\\";
var str = '鼎折\\'覆餗'`)
        assert.equal(result.result, 'var str = ' + result.markString[0] + '0' + result.markString[1] 
            + ';\nvar str = ' + result.markString[0] + '1' + result.markString[1])
        assert.deepEqual(result.extractString, ['嘻\\', '鼎折\'覆餗'])
    })

    it('从js代码中提取模板字符串', ()=>{
        let result = jsCodeString.extractStringFromJS(`var str = \`嘻嘻\n嘻\``)
        assert.equal(result.result, 'var str = ' + result.markString[0] + '0' + result.markString[1])
        assert.deepEqual(result.extractString, ['嘻嘻\n嘻'])
        
        result = jsCodeString.extractStringFromJS(`var str = \`嘻嘻\\\${1}嘻\``)
        assert.equal(result.result, 'var str = ' + result.markString[0] + '0' + result.markString[1])
        assert.deepEqual(result.extractString, ['嘻嘻${1}嘻'])
        
        result = jsCodeString.extractStringFromJS(`var str = \`嘻嘻\${1}嘻\``)
        assert.equal(result.result, 'var str = -||0%||1||%0||-')
        assert.deepEqual(result.extractString, ['嘻嘻{0}嘻'])
        
        result = jsCodeString.extractStringFromJS('var str = `嘻嘻${ "水电费" + `放到${2 + 1}地方` }嘻`')
        assert.equal(result.result, 'var str = -||0%|| -||1||- + -||2%||2 + 1||%2||- ||%0||-')
        assert.deepEqual(result.extractString, ['嘻嘻{0}嘻', '水电费', '放到{0}地方'])
        
        result = jsCodeString.extractStringFromJS('var str = `嘻嘻${ "水电费" + `放到${2 + 1}地方` }嘻${1}`')
        assert.equal(result.result, 'var str = -||0%|| -||1||- + -||2%||2 + 1||%2||- ||%%||1||%0||-')
        assert.deepEqual(result.extractString, ['嘻嘻{0}嘻{1}', '水电费', '放到{0}地方'])
    })

    it('测试注释', ()=>{
        let result = jsCodeString.extractStringFromJS(`var str = \`嘻嘻\n嘻\` //'test'`)
        assert.equal(result.result, 'var str = ' + result.markString[0] + '0' + result.markString[1] + ` //'test'`)
        assert.deepEqual(result.extractString, ['嘻嘻\n嘻'])

        result = jsCodeString.extractStringFromJS(`var str = /*'test'*/ \`嘻嘻\n嘻\``)
        assert.equal(result.result, 'var str = /*\'test\'*/ ' + result.markString[0] + '0' + result.markString[1])
        assert.deepEqual(result.extractString, ['嘻嘻\n嘻'])
    })

    it('测试正则', ()=>{
        console.warn('暂不支持正则')
        // let result = jsCodeString.extractStringFromJS(`var str = /'你'/ //'test'`)
        // assert.equal(result.result, "var str = /'你'/ //'test'")
        // assert.deepEqual(result.extractString, [])

        // result = jsCodeString.extractStringFromJS('var g, test = 1+/1+`你`+1/g')
        // assert.equal(result.result, "var g, test = 1+/1+`你`+1/g")
        // assert.deepEqual(result.extractString, [])

        // result = jsCodeString.extractStringFromJS('var g, test = 1/1+`你`+1/g')
        // assert.equal(result.result, "var g, test = 1+/1+" + result.markString[0] + 0 + result.markString[1] + "+1/g")
        // assert.deepEqual(result.extractString, [`你`])
    })
})
