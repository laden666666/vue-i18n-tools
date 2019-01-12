<template>
    <div class="main">
        <template v-if="keyCode">
            <Row  :gutter="16">
                <Col span="12">
<pre class="content" v-html="resultCode"></pre>
                </Col>
                <Col span="12">
<pre class="content">{
    {{keyCode}}
}</pre>
                </Col>
            </Row>
                <Button long type="error" @click="goback2">
                    返回
                </Button>
            </Row>
        </template>
        <template v-else-if="findWordArr.length > 0">
            <Input v-model='pageName'>
                <span slot="prepend">页面namespace</span>
            </Input>
            <Row  :gutter="16">
                <Col span="12">
<pre class="result" v-html="showReplaceCodeHTML" key="result"></pre>
                </Col>
                <Col span="12">
                    <ul class="word-list">
                        <li class="word-list-item" v-for="word in findWordArr" :key="word.index">
                            <Checkbox v-model="word.used" >{{word.index + 1}}. {{word.word}}</Checkbox>
                            <p class="word-list-item-key">
                                <Input v-if="word.used" @on-focus="focus(word.index)" 
                                    @on-blur="blur(word.index)" placeholder="请输入该国际化文本的key" v-model="word.key" />
                            </p>
                        </li>
                    </ul>
                </Col>
            </Row>
            <Row  :gutter="16">
                <Col span="12">
                    <Button long type="error" @click="goback">
                        返回
                    </Button>
                </Col>
                <!-- <Col span="8">
                    <Button long @click="getKey">
                        生成未完成的KEY
                    </Button>
                </Col> -->
                <Col span="12">
                    <Tooltip content="请输入所有国际化文本的key" v-if="!replaceDisable" style="width: 100%;">
                        <Button :disabled="true" long type="primary">
                            替换
                        </Button>
                    </Tooltip>
                    <Button v-else long type="primary" @click="replace">
                        替换
                    </Button>
                </Col>
            </Row>
        </template>
        <template v-else>
            <div class="inputCode">
                <textarea placeholder="输入要提取国际化的页面代码" class="content" rows="40" cols="100" v-model="code"></textarea>
                <Button type="primary" @click="analyse" long>寻找中文字符</Button>
            </div>
        </template>
    </div>
</template>
<style scoped>
    .main{
        padding: 10px;
        width: calc(100vw - 20px);
        height: calc(100vh - 52px);
        box-sizing: border-box;
        margin: 0 auto;
    }
    .main button{
        padding: 5px;
        cursor: pointer;
    }
    .inputCode{
        display: flex;
        flex-direction: column;
    }
    .inputPageName{
        display: flex;
        justify-content: flex-start;
        align-items: center;
        padding: 5px 0;
    }

    .layout{
        display: flex;
    }
    .content{
        height: calc(100vh - 42px - 65px);
        padding: 5px;
        margin: 5px 0;
        border: 1px solid #dcdee2;
        border-radius: 5px;
        overflow: auto;
        text-align: left;
    }
    .result{
        height: calc(100vh - 42px - 100px);
        padding: 5px;
        margin: 5px 0;
        border: 1px solid #dcdee2;
        border-radius: 5px;
        overflow: auto;
        text-align: left;
    }
    .word-list{
        list-style: none;
        height: calc(100vh - 42px - 100px);
        padding: 5px;
        margin: 5px 0;
        border: 1px solid #dcdee2;
        border-radius: 5px;
        overflow: auto;
        
    }
    .word-list li{
        list-style: none;
        justify-content: flex-start;
        display: flex;
        flex-wrap: wrap;
        margin-bottom: 15px;
    }
    .word-list-item-key{
        width: 100%;
    }
    .main >>> .heightlight{
        color: red;
        font-weight: bold;
    }
    .main >>> .heightlight.active{
        text-shadow: 0 0 1px #ffa606;
        animation: hue 2s infinite linear;
    }
    @keyframes hue {
        10% {
            color: red;
        }
        50% {
            color: #ffa606;
        }
        90% {
            color: red;
        }
    }
</style>
<script>
import axios from 'axios'
import vueCodeString from '../service/vueCodeString.ts'
import {markString, interpolationMark} from '../service/common'
function getKeyName(...str){
    str = str.filter(str=>str).reduce((arr, name)=>{
        return [...arr, ...(name.trim().split(/\s+/g))]
    }, [])
    return str.slice(0, 3).map(name=>name.toLowerCase()).join('_')
}

export default {
    name: 'HelloWorld',
    data () {
        return {
            pageName: '',
            code: ``,
            findWordArr: [],
            replaceCode: '',
            resultCode: '',
            keyCode: '',
        }
    },
    computed: {
        showReplaceCode(){
            if(!this.replaceCode){
                return ''
            }
            let code = this.findWordArr.reduce((replaceCode, findWord, index)=>{
                
                if(!findWord.used){
                    if(replaceCode.indexOf(`${markString[0]}${findWord.index}${interpolationMark[0]}`) > -1){
                        let start = replaceCode.indexOf(`${markString[0]}${findWord.index}${interpolationMark[0]}`),
                        end = replaceCode.indexOf(`${interpolationMark[1]}${findWord.index}${markString[1]}`) + `${markString[1]}${findWord.index}${interpolationMark[1]}`.length
                    
                        return replaceCode.substr(0, start) + findWord.originalCode + replaceCode.substr(end)
                    } else {
                        return replaceCode.replace(markString[0] + findWord.index + markString[1], findWord.originalCode)
                    }
                } else {
                    replaceCode = replaceCode.replace(markString[0] + findWord.index + markString[1], findWord.replaceCode)
                }
                return replaceCode
                    
            },this.replaceCode)

            return code
        },
        showReplaceCodeHTML(){

            let div = document.createElement('div')
            div.textContent = this.showReplaceCode
            let html = div.innerHTML
            html = this.findWordArr.reduce((html, word, index)=>{
                return html.replace(`${markString[0]}${index}${markString[1]}`, `<span class="heightlight word${index}">$t(${index + 1})</span>`)
                    .replace(`${markString[0]}${index}${interpolationMark[0]}`, `<span class="heightlight word${index}">$t(${index + 1}, [</span>`)
                    .replace(`${interpolationMark[1]}${index}${interpolationMark[0]}`, `<span class="heightlight word${index}">,</span>`)
                    .replace(`${interpolationMark[1]}${index}${markString[1]}`, `<span class="heightlight word${index}">])</span>`)
            }, html)


            return html
        },
        replaceDisable(){
            return this.findWordArr.reduce((bool, findWord)=>bool && (!findWord.used || findWord.key), true)
        }
    },
    watch: {
        code(){
            this.findWordArr = []
            this.replaceCode = ''
            this.resultCode = ''
        },
    },
    methods: {
        analyse(){
            function hit(code){
                return /[\u4e00-\u9fa5]/.test(code)
            }

            let result = vueCodeString.extractStringFromVue(this.code, {
                filter: hit
            })
            window.result = result
            this.replaceCode = result.result
            this.findWordArr = result.extractString.map(item=>{
                return {
                    ...item,
                    used: true,
                    key: '',
                }
            })
        },
        replace(){
            let keyArr = []

            let div = document.createElement('div')
            div.textContent = this.showReplaceCode
            let html = div.innerHTML

            this.resultCode = this.findWordArr.reduce((replaceCode, word, index)=>{
                
                if(!word.used){
                    if(replaceCode.indexOf(`${markString[0]}${word.index}${interpolationMark[0]}`) > -1){
                        let start = replaceCode.indexOf(`${markString[0]}${word.index}${interpolationMark[0]}`),
                        end = replaceCode.indexOf(`${interpolationMark[1]}${word.index}${markString[1]}`) + `${markString[1]}${word.index}${interpolationMark[1]}`.length
                    
                        return replaceCode.substr(0, start) + word.originalCode + replaceCode.substr(end)
                    } else {
                        return replaceCode.replace(markString[0] + word.index + markString[1], word.originalCode)
                    }
                } else {
                    let key = getKeyName(this.pageName || '', word.key)

                    keyArr.push([key, word.word])

                    let quotationMarks = '\''
                    let t = '$t'
                    if(word.replaceType === 'vue-attr' && '\'' === word.quotationMarks){
                        quotationMarks = '"'
                    }
                    if(word.replaceType === 'js'){
                        t = 'this.$t'
                    }

                    return replaceCode.replace(`${markString[0]}${index}${markString[1]}`, `<span class="heightlight">${t}(${quotationMarks}${word.key}${quotationMarks})</span>`)
                        .replace(`${markString[0]}${index}${interpolationMark[0]}`, `<span class="heightlight">${t}(${quotationMarks}${word.key}${quotationMarks}, [</span>`)
                        .replace(`${interpolationMark[1]}${index}${interpolationMark[0]}`, `<span class="heightlight">, </span>`)
                        .replace(`${interpolationMark[1]}${index}${markString[1]}`, `<span class="heightlight">])</span>`)
                }
            }, html)

            this.keyCode = keyArr.map(([key, value])=>`"${key}": "${value.replace(/[\n]/g, '')}"`).join(',\n    ')
        },
        goback2(){
            this.keyCode = ''
            this.resultCode = ''
        },
        goback(){
            
            this.replaceCode = ''
            this.findWordArr = []
        },
        async getKey(){
            try{
                this.$Spin.show({
                    render: (h) => {
                        return h('div', [
                            h('Icon', {
                                'class': 'demo-spin-icon-load',
                                props: {
                                    type: 'ios-loading',
                                    size: 18
                                }
                            }),
                            h('div', 'Loading')
                        ])
                    }
                });
                let data = await axios.get(`/transapi?from=cht&to=en&query=${this.findWordArr.map(word=>word.word).join('%0A')}`)
                this.findWordArr.forEach((_data, index)=>{
                    if(!_data.key){
                        _data.key = getKeyName(data.data.data[index].dst) 
                    } 
                })
            } catch (e){
                console.error(e)
                this.$Message.error(e);
            }
             this.$Spin.hide();
        },
        focus(index){
            let word = document.querySelectorAll('.word' + index)
            if(word.length){
                word[0].scrollIntoView()
                for(let i = 0; i < word.length; i++){
                    word[i].classList.add('active')
                }
            }
        },
        blur(index){
            let word = document.querySelectorAll('.word' + index)
            if(word.length){
                word[0].scrollIntoView()
                for(let i = 0; i < word.length; i++){
                    word[i].classList.remove('active')
                }
            }
        },
    }
}
</script>