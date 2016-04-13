PROJECT_ROOT = (__dirname + '/')

var fs = require("fs")

PARSERS = [
    "ubx"
]

PROCESSORS = [
    "rtk_positioning"
]

var express = require('express')

var app = express()
app.use(require('./auth-middleware'))
app.use(require('./controllers'))

if (!fs.existsSync("./temp")){
    fs.mkdirSync("./temp");
}

app.listen(3000, function() {
    console.log("Server Listening on", 3000)
})