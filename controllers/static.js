var router = require('express').Router()
var express = require('express')

router.get('/', function(req, res) {
    res.sendFile('./layouts/home.html', {
        root: PROJECT_ROOT
    })
})
router.use(express.static(__dirname + '/../assets'))

module.exports = router
