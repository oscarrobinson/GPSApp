var bodyParser = require('body-parser')
var router = require('express').Router()

router.use(bodyParser.json())

router.use(require('./api/projects'))
router.use(require('./static'))

module.exports = router
