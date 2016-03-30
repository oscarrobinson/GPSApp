PROJECT_ROOT = (__dirname + '/')

PARSERS = [
    "ubx"
]

PROCESSORS = [
    "ionospheric_correction"
]

var express = require('express')

var app = express()
app.use(require('./auth-middleware'))
app.use(require('./controllers'))

app.listen(3000, function() {
    console.log("Server Listening on", 3000)
})