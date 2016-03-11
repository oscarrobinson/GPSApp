PROJECT_ROOT = (__dirname + '/')

PARSERS = [
    "ubx"
]

var express = require('express')

var app = express()
app.use(require('./auth-middleware'))
app.use(require('./controllers'))

app.listen(3000, function() {
    console.log("Server Listening on", 3000)
})
