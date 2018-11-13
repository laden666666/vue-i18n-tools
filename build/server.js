var express = require('express');
var axios = require('axios');
var app = express();

app.get('/transapi', function(req, res){
    
    return axios.get('https://fanyi.baidu.com/transapi?from=cht&to=en&query=' + encodeURIComponent(req.query.query) )
        .then(function(data){
            res.send(data.data)
        }).catch(function(e){
            res.status(500).send('Something broke!');
            console.error(e)
        })

})

app.listen(3000, function(){
    console.log('监听3000端口')
});