PROJECT_ROOT = __dirname

var express = require('express')
var bodyParser = require('body-parser')

var app = express()

var Project = require('./models/project')

app.use(bodyParser.json())
app.get('/', function(req, res) {
    res.sendFile('./layouts/home.html', {
        root: PROJECT_ROOT
    })
})

app.get('/api/projects', function(req, res, next) {
    Project.find(function(err, projects) {
        if (err) {
            return next(err)
        }
        res.json(projects)
    })
})

app.listen(3000, function() {
    console.log("Server Listening on", 3000)
})
