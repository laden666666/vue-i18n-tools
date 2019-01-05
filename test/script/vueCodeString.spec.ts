import * as chai from 'chai'

let assert = chai.assert

import {parseHTML} from '../../src/service/vueCodeString/html-parser'
import vueCodeString from '../../src/service/vueCodeString'

describe('测试parseHTML', ()=>{

    it('测试标签抽取', ()=>{
        let result: any[][] = []
        parseHTML(' <div id="a">11</div>', {
            start: function(...arg){
                result.push(['start', ...arg])
            },
            end: function(...arg){
                result.push(['end', ...arg])
            },
            comment: function(...arg){
                result.push(['comment', ...arg])
            },
            chars: function(...arg){
                result.push(['chars', ...arg])
            },
        })

        assert.deepEqual(result, [
            ['chars', ' ', 0, 1],
            ['start', 'div', [{
                "name": "id",
                "value": "a",
                start: 5,
                end: 12,
                quotationMarks: '"',
                code: ' id="a"'
            }], 1, 13],
            ['chars', '11', 13, 15],
            ['end', 'div', 15, 21],
        ])
    })

    it('不闭合标签测试', ()=>{
        let result: any[][] = []
        parseHTML(' <div id="a">111', {
            start: function(...arg){
                result.push(['start', ...arg])
            },
            end: function(...arg){
                result.push(['end', ...arg])
            },
            comment: function(...arg){
                result.push(['comment', ...arg])
            },
            chars: function(...arg){
                result.push(['chars', ...arg])
            },
        })

        assert.deepEqual(result, [
            ['chars', ' ', 0, 1],
            ['start', 'div', [{
                "name": "id",
                "value": "a",
                quotationMarks: '"',
                start: 5,
                end: 12,
                code: ' id="a"'
            }], 1, 13],
            ['chars', '111', 13, 16],
            ['end', 'div', 16, 16],
        ])
    })

    it('不闭合标签测试2', ()=>{
        let result: any[][] = []
        parseHTML(' <div id="a"><a>111</a>', {
            start: function(...arg){
                result.push(['start', ...arg])
            },
            end: function(...arg){
                result.push(['end', ...arg])
            },
            comment: function(...arg){
                result.push(['comment', ...arg])
            },
            chars: function(...arg){
                result.push(['chars', ...arg])
            },
        })

        assert.deepEqual(result, [
            ['chars', ' ', 0, 1],
            ['start', 'div', [{
                "name": "id",
                "value": "a",
                quotationMarks: '"',
                start: 5,
                end: 12,
                code: ' id="a"'
            }], 1, 13],
            ['start', 'a', [], 13, 16],
            ['chars', '111', 16, 19],
            ['end', 'a', 19, 23],
            ['end', 'div', 23, 23],
        ])
    })

    it('不闭合标签测试3', ()=>{
        let result: any[][] = []
        parseHTML(' <div id="a"><a>111</div>', {
            start: function(...arg){
                result.push(['start', ...arg])
            },
            end: function(...arg){
                result.push(['end', ...arg])
            },
            comment: function(...arg){
                result.push(['comment', ...arg])
            },
            chars: function(...arg){
                result.push(['chars', ...arg])
            },
        })

        assert.deepEqual(result, [
            ['chars', ' ', 0, 1],
            ['start', 'div', [{
                "name": "id",
                "value": "a",
                quotationMarks: '"',
                start: 5,
                end: 12,
                code: ' id="a"'
            }], 1, 13],
            ['start', 'a', [], 13, 16],
            ['chars', '111', 16, 19],
            ['end', 'a', 19, 19],
            ['end', 'div', 19, 25],
        ])
    })
    
    it('获取属性测试', ()=>{
        let result: any[] = []
        parseHTML(' <div id="a" :b="b" v-a="\'c\'" @click="d" v-bind:attr=\'e\' e=f h></div>', {
            start: function(tag, attrs){
                result = attrs
            },
        })

        assert.deepEqual(result, [
            {
                name: 'id',
                value: 'a',
                start: 5,
                quotationMarks: '"',
                end: 12,
                code: ' id="a"'
            },
            {
                name: ':b',
                value: 'b',
                start: 12,
                quotationMarks: '"',
                end: 19,
                code: ' :b="b"'
            },
            {
                name: 'v-a',
                value: "'c'",
                start: 19,
                quotationMarks: '"',
                end: 29,
                code: ' v-a="\'c\'"'
            },
            {
                name: '@click',
                value: 'd',
                quotationMarks: '"',
                start: 29,
                end: 40,
                code: ' @click="d"'
            },
            {
                name: 'v-bind:attr',
                value: 'e',
                start: 40,
                quotationMarks: '\'',
                end: 56,
                code: ' v-bind:attr=\'e\''
            },
            {
                name: 'e',
                value: 'f',
                start: 56,
                quotationMarks: '',
                end: 60,
                code: ' e=f'
            },
            {
                name: 'h',
                value: '',
                start: 60,
                quotationMarks: '',
                end: 62,
                code: ' h'
            },
        ])
    })
    
    it('内容中带{{}}', ()=>{
        let result: any[] = []
        parseHTML('<div>{{a}}<!--b-->{{c}}</div>', {
            start: function(...arg){
                result.push(['start', ...arg])
            },
            end: function(...arg){
                result.push(['end', ...arg])
            },
            comment: function(...arg){
                result.push(['comment', ...arg])
            },
            chars: function(...arg){
                result.push(['chars', ...arg])
            },
        })

        assert.deepEqual(result, [
            ['start', 'div', [], 0, 5],
            ['chars', '{{a}}', 5, 10],
            ['comment', 'b'],
            ['chars', '{{c}}', 18, 23],
            ['end', 'div', 23, 29],
        ])
    })
})



describe('测试VueCodeString', ()=>{
    it('vue的:@v-属性测试', ()=>{
        let result = vueCodeString.extractStringFromVue(
            `<template><div :id="'test'"></div></template>`)
        assert.equal(result.result, `<template><div :id="${result.markString[0]}0${result.markString[1]}"></div></template>`)
        assert.deepEqual(result.extractString, [{
            "index": 0,
            "originalCode": "'test'",
            "replaceCode": `${result.markString[0]}0${result.markString[1]}`,
            "word": "test",
            type: 1,
        }])
    
        result = vueCodeString.extractStringFromVue(
            `<template><a v-id="'test'"><div @id='"test"'></div></a></template>`)
        assert.equal(result.result, `<template><a v-id="${result.markString[0]}0${result.markString[1]}"><div @id='${result.markString[0]}1${result.markString[1]}'></div></a></template>`)
        assert.deepEqual(result.extractString, [{
            "index": 0,
            "originalCode": "'test'",
            "replaceCode": `${result.markString[0]}0${result.markString[1]}`,
            "word": "test",
            type: 1,
        }, {
            "index": 1,
            "originalCode": '"test"',
            "replaceCode": `${result.markString[0]}1${result.markString[1]}`,
            "word": "test",
            type: 1,
        }])
    
        result = vueCodeString.extractStringFromVue(
            `<template><a><div @id='a("test", "test")'></div></a></template>`)
        assert.equal(result.result, `<template><a><div @id='a(${result.markString[0]}0${result.markString[1]}, ${result.markString[0]}1${result.markString[1]})'></div></a></template>`)
        assert.deepEqual(result.extractString, [{
            "index": 0,
            "originalCode": '"test"',
            "replaceCode": `${result.markString[0]}0${result.markString[1]}`,
            "word": "test",
            type: 1,
        }, {
            "index": 1,
            "originalCode": '"test"',
            "replaceCode": `${result.markString[0]}1${result.markString[1]}`,
            "word": "test",
            type: 1,
        }])
    })

    it('vue的属性测试', ()=>{
        let result = vueCodeString.extractStringFromVue(
            `<template><div id="te'st"></div></template>`)
        assert.equal(result.result, `<template><div :id='${result.markString[0]}0${result.markString[1]}'></div></template>`)
        assert.deepEqual(result.extractString, [{
            "index": 0,
            "originalCode": 'id="te\'st"',
            "replaceCode": `:id='${result.markString[0]}0${result.markString[1]}'`,
            "word": "te'st",
            type: 1,
        },])

        result = vueCodeString.extractStringFromVue(
            `<template><div id="test"><a id='test'></a></div></template>`)
        assert.equal(result.result, `<template><div :id='${result.markString[0]}0${result.markString[1]}'><a :id="${result.markString[0]}1${result.markString[1]}"></a></div></template>`)
        assert.deepEqual(result.extractString, [{
            "index": 0,
            "originalCode": 'id="test"',
            "replaceCode": `:id='${result.markString[0]}0${result.markString[1]}'`,
            "word": "test",
            type: 1,
        }, {
            "index": 1,
            "originalCode": "id='test'",
            "replaceCode": `:id="${result.markString[0]}1${result.markString[1]}"`,
            "word": "test",
            type: 1,
        }])
    })

    it('vue的普通文本', ()=>{
        let result = vueCodeString.extractStringFromVue(
            `<template><div>test</div></template>`)
        assert.equal(result.result, `<template><div>{{${result.markString[0]}0${result.markString[1]}}}</div></template>`)
        assert.deepEqual(result.extractString, [{
            "index": 0,
            "originalCode": 'test',
            "replaceCode": `{{${result.markString[0]}0${result.markString[1]}}}`,
            "word": "test",
            type: 2,
        },])

        result = vueCodeString.extractStringFromVue(
            `<template><div>test{{test</div></template>`)
        assert.equal(result.result, `<template><div>{{${result.markString[0]}0${result.markString[1]}}}</div></template>`)
        assert.deepEqual(result.extractString, [{
            "index": 0,
            "originalCode": 'test{{test',
            "replaceCode": `{{${result.markString[0]}0${result.markString[1]}}}`,
            "word": "test{{test",
            type: 2,
        }])
    })

    it('vue的带{{}}文本', ()=>{
        let result = vueCodeString.extractStringFromVue(
            `<template><div>{{test + 'test'}}</div></template>`)
        assert.equal(result.result, `<template><div>{{test + ${result.markString[0]}0${result.markString[1]}}}</div></template>`)
        assert.deepEqual(result.extractString, [{
            "index": 0,
            "originalCode": '\'test\'',
            "replaceCode": `${result.markString[0]}0${result.markString[1]}`,
            "word": "test",
            type: 2,
        },])

        result = vueCodeString.extractStringFromVue(
            `<template><div>test{{test + 'test'}}</div></template>`)
        assert.equal(result.result, `<template><div>{{${result.markString[0]}0${result.markString[1]}}}{{test + ${result.markString[0]}1${result.markString[1]}}}</div></template>`)
        assert.deepEqual(result.extractString, [{
            "index": 0,
            "originalCode": 'test',
            "replaceCode": `{{${result.markString[0]}0${result.markString[1]}}}`,
            "word": "test",
            type: 2,
        },{
            "index": 1,
            "originalCode": '\'test\'',
            "replaceCode": `${result.markString[0]}1${result.markString[1]}`,
            "word": "test",
            type: 2,
        },])

        result = vueCodeString.extractStringFromVue(
            `<template><div>test{{test + 'test'}}{{test</div></template>`)
        assert.equal(result.result, `<template><div>{{${result.markString[0]}0${result.markString[1]}}}`
            + `{{test + ${result.markString[0]}1${result.markString[1]}}}{{${result.markString[0]}2${result.markString[1]}}}</div></template>`)
        assert.deepEqual(result.extractString, [{
            "index": 0,
            "originalCode": 'test',
            "replaceCode": `{{${result.markString[0]}0${result.markString[1]}}}`,
            "word": "test",
            type: 2,
        },{
            "index": 1,
            "originalCode": "'test'",
            "replaceCode": `${result.markString[0]}1${result.markString[1]}`,
            "word": "test",
            type: 2,
        },{
            "index": 2,
            "originalCode": '{{test',
            "replaceCode": `{{${result.markString[0]}2${result.markString[1]}}}`,
            "word": "{{test",
            type: 2,
        }])

        result = vueCodeString.extractStringFromVue(
            `<template><div>test{{test + 'test'}}xx{{test</div></template>`)
        assert.equal(result.result, `<template><div>{{${result.markString[0]}0${result.markString[1]}}}`
            + `{{test + ${result.markString[0]}1${result.markString[1]}}}{{${result.markString[0]}2${result.markString[1]}}}</div></template>`)
        assert.deepEqual(result.extractString, [{
            "index": 0,
            "originalCode": 'test',
            "replaceCode": `{{${result.markString[0]}0${result.markString[1]}}}`,
            "word": "test",
            type: 2,
        },{
            "index": 1,
            "originalCode": "'test'",
            "replaceCode": `${result.markString[0]}1${result.markString[1]}`,
            "word": "test",
            type: 2,
        },{
            "index": 2,
            "originalCode": 'xx{{test',
            "replaceCode": `{{${result.markString[0]}2${result.markString[1]}}}`,
            "word": "xx{{test",
            type: 2,
        }])
    })

    it('vue的script', ()=>{
        let result = vueCodeString.extractStringFromVue(
            `<template><div>{{test + 'test'}}</div></template><script>var a = 'test'</script>`)
        assert.equal(result.result, `<template><div>{{test + ${result.markString[0]}0${result.markString[1]}}}</div>`
            + `</template><script>var a = ${result.markString[0]}1${result.markString[1]}</script>`)
        assert.deepEqual(result.extractString, [{
            "index": 0,
            "originalCode": '\'test\'',
            "replaceCode": `${result.markString[0]}0${result.markString[1]}`,
            "word": "test",
            type: 2,
        },{
            "index": 1,
            "originalCode": '\'test\'',
            "replaceCode": `${result.markString[0]}1${result.markString[1]}`,
            "word": "test",
            type: 0,
        },])

    })
})

