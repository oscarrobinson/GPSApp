PROJECT_ROOT = __dirname

var express = require('express')
var bodyParser = require('body-parser')

var app = express()

var Project = require('./models/project')

app.use(bodyParser.json())


app.use(require('./controllers/api/projects'))
app.use(require('./controllers/static'))

app.listen(3000, function() {
    console.log("Server Listening on", 3000)
})
