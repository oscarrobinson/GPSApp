PROJECT_ROOT = __dirname

var express = require('express')
var bodyParser = require('body-parser')

var app = express()

app.use(bodyParser.json())
app.get('/', function(req, res) {
    res.sendFile('./layouts/home.html', {
        root: PROJECT_ROOT
    })
})

app.listen(3000, function() {
    console.log("Server Listening on", 3000)
})
