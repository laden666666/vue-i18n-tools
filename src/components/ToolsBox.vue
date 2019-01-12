<template>
    <div class="toolsBox">
        <Button type="primary" @click="goReadMe" shape="circle" icon="md-help-circle">查看readme</Button>
        <div class="github-btn-group">
            <iframe class="github-btn" src="https://ghbtns.com/github-btn.html?user=laden666666&repo=vue-i18n-tools&type=star&count=false&size=large" frameborder="0" scrolling="0" width="80px" height="30px"></iframe>
            <iframe class="github-btn" src="https://ghbtns.com/github-btn.html?user=laden666666&repo=vue-i18n-tools&type=fork&count=false&size=large" frameborder="0" scrolling="0" width="80px" height="30px"></iframe>
        </div>
    </div>
</template>

<script>
    export default {
        data () {
            return {
            }
        },
        methods: {
            goReadMe(){
                location.href = 'https://github.com/laden666666/vue-i18n-tools'
            }
        },
    }
</script>

<style scoped>
    .toolsBox{
        padding: 10px 20px 0;
    }
    .github-btn-group{
        vertical-align: middle;
        line-height: 0;
        float: right;
    }
    .github-btn{
    }
</style>