import jsCodeString from '../../src/service/jsCodeString'
import * as chai from 'chai'
let assert = chai.assert

describe('测试检测文本', ()=>{

    it('测试检测中文', ()=>{
        assert.equal(jsCodeString.checkHasLanguage('中文'), true)
    })

    it('从js代码中提取字符串', ()=>{
        assert.equal(jsCodeString.extractStringFromJS(`var str = "嘻嘻嘻"`).result, '')
    })
})
