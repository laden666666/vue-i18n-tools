<template>
    <div class="main">
        <Input v-model='pageName'>
            <span slot="prepend">页面namespace</span>
        </Input>
        <template v-if="keyCode">
            <Row  :gutter="16">
                <Col span="12">
<pre class="result">{{resultCode}}</pre>
                </Col>
                <Col span="12">
<pre class="result">{
    {{keyCode}}
}</pre>
                </Col>
            </Row>
                <Button long type="error" @click="goback">
                    返回
                </Button>
            </Row>
        </template>
        <template v-else-if="findWordArr.length > 0">
            <Row  :gutter="16">
                <Col span="12">
                <div style="display: none;" ref="html">{{showReplaceCode}}</div>
<pre class="result" ref="result" key="result"></pre>
                </Col>
                <Col span="12">
                    <ul class="word-list">
                        <li class="word-list-item" v-for="word in findWordArr" :key="word.index">
                            <Checkbox v-model="word.used" >{{word.word}}</Checkbox>
                            <p class="word-list-item-key">
                                <Input v-if="word.used" placeholder="请输入该国际化文本的key" v-model="word.key" />
                            </p>
                        </li>
                    </ul>
                </Col>
            </Row>
            <Row  :gutter="16">
                <Col span="8">
                    <Button long type="error" @click="reset">
                        重输
                    </Button>
                </Col>
                <Col span="8">
                    <Button long @click="getKey">
                        生成未完成的KEY
                    </Button>
                </Col>
                <Col span="8">
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
                <textarea placeholder="输入要提取国际化的页面代码" class="result" rows="40" cols="100" v-model="code"></textarea>
                <Button type="primary" @click="analyse" long>寻找中文字符</Button>
            </div>
        </template>
    </div>
</template>
<style scoped>
    .main{
        padding: 10px;
        width: calc(100vw - 20px);
        height: 100vh;
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
    .result{
        height: calc(100vh - 100px);
        padding: 5px;
        margin: 5px 0;
        border: 1px solid #dcdee2;
        border-radius: 5px;
        overflow: auto;
        text-align: left;
    }
    .word-list{
        list-style: none;
        height: calc(100vh - 100px);
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
</style>
<script>
import axios from 'axios'
import vueCodeString from '../service/vueCodeString.ts'
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
            return this.findWordArr.reduce((replaceCode, findWord, index)=>{
                if(!findWord.used){
                    return replaceCode.replace('-||' + findWord.index + '||-', findWord.originalCode)
                }
                return replaceCode.replace('-||' + findWord.index + '||-', findWord
                    .replaceCode.replace('|' + findWord.index + '|', '|' + index + '|'))
                    
            },this.replaceCode)
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
        showReplaceCode(){
            this.$nextTick(()=>{
                if(!this.$refs.html){
                    return
                }
                let html = this.$refs.html.innerHTML
                html = this.findWordArr.reduce((html, word, index)=>{
                    return html.replace(`|${index}|`, `<span class="heightlight">|${index}|</span>`)
                }, html)

                this.$refs.result.innerHTML = html
            })
        },
    },
    methods: {
        analyse(){
            function hit(code){
                return /[\u4e00-\u9fa5]/.test(code)
            }

            // function pushWord(code, word, arr, fn){
            //     if(!fn){
            //         fn = function(code, word, replace ){
            //             return code.replace(word, replace)
            //         }
            //     }
            //     let index = arr.length
            //     arr.push({
            //         index,
            //         word,
            //         originalCode: code,
            //         key: '',
            //         replaceCode: fn(code, word, '|' + index + '|'),
            //         used: true,
            //     })
            //     return '||' + index + '||'
            // }
            // var words = []
            // let replaceCode = this.code
            // // 普通属性（"）
            // .replace(/(?::?|v-?|v-bind:?|v-on:?|@?)[\w-]+="([^"]*)"|(?::?|v-?|v-bind:?|v-on:?|@?)[\w-]+='([^']*)'/g, function(code, str, str2, index){
            //     let word = str || str2
            //     if(code[0] == ':' || code.substr(0, 2) == 'v-' || code[0] == '@' || !hit(word)){
            //         return code
            //     }

            //     return pushWord(code, word, words, function(code, word, replace){
            //         return ':' + code.replace(word, replace)
            //     })
            // }).replace(/(?:>|\}{2})[\s\n\r\t]*?([^><\{{2}\}{2}]+)[\s\n\r\t]*?(?:<|\{{2})/g, function(code, str){
            //     if(!hit(str)){
            //         return code
            //     }
            //     return pushWord(code, str.trim(), words, function(code, word, replace){
            //         return code.replace(word, '{{' + replace + '}}')
            //     })
            // }).replace(/('[^"']*?')|("[^"']*?")/ig, function(code, str, str2){
            //     let word = str || str2
            //     word = word.substr(1, word.length - 2)

            //     if(!hit(word)){
            //         return code
            //     }
            //     return pushWord(code, word, words, function(cord, word, replace){
            //         return code.replace(str || str2,  replace)
            //     })
            // }).replace(/(`[^`]*?`)/ig, function(code, word){
            //     word = word.substr(1, word.length - 2)
            //     if(!hit(word)){
            //         return code
            //     }
            //     var i = 0
            //     let word2 = word.replace(/\$\{.*?\}/g, ()=>{
            //         return `{${i++}}`
            //     })

            //     return pushWord(code, word2, words, function(cord, word, replace){
            //         return replace
            //     })
            // })

            // // 排序
            // let findFoundWordRep = /\|\|(\d+)\|\|/g
            // let sortArr = []

            // for(let find = findFoundWordRep.exec(replaceCode); find; find = findFoundWordRep.exec(replaceCode)){
            //     sortArr.push(parseInt(find[1]))
            // }

            // let sortMap = sortArr.reduce((_map, i, index)=>{
            //     _map[i] = index
            //     return _map
            // },{})

            // words.sort((item1, item2)=>{
            //     return sortMap[item1.index] > sortMap[item2.index] ? 1 : -1
            // })

            let result = vueCodeString.extractStringFromVue(this.code, {
                filter: hit
            })
            console.log(result)

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
            this.resultCode = this.findWordArr.reduce((replaceCode, word, index)=>{
                
                if(!word.used){
                    return replaceCode.replace('||' + word.index + '||', word.originalCode)
                } else {
                    let key = getKeyName(this.pageName || '', word.key)

                    keyArr.push([key, word.word])

                    let replacedStr = ''
                    if(word.originalCode[0] == '\''){
                        replacedStr = `$t('${key}')`
                    } else if(word.originalCode[0] == '"'){
                        replacedStr = `$t("${key}")`
                    } else if(word.originalCode[0] == '`'){

                        let findRep = /\$\{(.*?)\}/g
                        let findArr = []

                        for(let find = findRep.exec(word.originalCode); find; find = findRep.exec(word.originalCode)){
                            findArr.push(find[1])
                        }
                        replacedStr = `$t(\`${key}\`,[${findArr.join(',')}])`
                    } else {
                        replacedStr = word.originalCode.indexOf('"') >= word.originalCode.indexOf('\'') 
                            ? `$t('${key}')` : `$t("${key}")`
                    } 
                    return replaceCode.replace('||' + word.index + '||',  word.replaceCode.replace('|' + word.index + '|', replacedStr))
                }
            }, this.replaceCode)
            this.keyCode = keyArr.map(([key, value])=>`"${key}": "${value.replace(/[\n]/g, '')}"`).join(',\n')
        },
        goback(){
            this.keyCode = ''
            this.resultCode = ''
        },
        reset(){
            this.code = ''
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
    }
}
</script>

