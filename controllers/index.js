var bodyParser = require('body-parser')
var router = require('express').Router()

router.use(bodyParser.json())

router.use(require('./api/projects'))
router.use(require('./api/templates'))
router.use(require('./api/instances'))
router.use(require('./api/sessions'))
router.use(require('./api/auth'))
router.use(require('./static'))

module.exports = router
