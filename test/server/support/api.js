var express = require('express')
var request = require('supertest')
var router = require('../../../controllers')
var bodyParser = require('body-parser')

var app = express()
app.use(require('../../../auth-middleware'))
app.use(bodyParser.json())
app.use(router)

//return new app wrapped in supertest
module.exports = request(app)
