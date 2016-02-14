var Project = require("../../models/project")
var router = require('express').Router()
var multer = require('multer')
var upload = multer({
    dest: 'uploads/'
})

router.post('/api/projects/:id/sessions', upload.array('files', 4), function(req, res, next) {
    console.log(req.files)
    //req.files always in order zip,csv,obs,ephem
    var zipFile = req.files[0]
    var csvFile = req.files[1]
    var obsFile = req.files[2]
    var ephemFile = req.files[3]
    //return error 400 if files wrong
    //validate what can be done with data here
    //create session and create process options for session
    //may have more than one sensor file per instance

})

module.exports = router
