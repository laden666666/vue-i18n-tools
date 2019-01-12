<template>
    <div id="app">
        <Main/>
    </div>
</template>

<script>
import Main from './components/Main'

export default {
    name: 'App',
    components: {
        Main
    }
}
</script>

<style>
    html, body{
        margin: 0;
        padding: 0;
    }
    #app {
        font-family: 'Avenir', Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        color: #2c3e50;
    }
</style>
