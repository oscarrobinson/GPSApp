var router = require('express').Router()
var express = require('express')

router.get('/', function(req, res) {
    res.sendFile('./layouts/app.html', {
        root: PROJECT_ROOT
    })
})
router.use(express.static(__dirname + '/../assets'))
router.use(express.static(__dirname + '/../templates'))

module.exports = router
