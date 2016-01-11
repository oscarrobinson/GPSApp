var Project = require("../../models/project")
var router = require('express').Router()

router.get('/api/projects', function(req, res, next) {
    Project.find(function(err, projects) {
        if (err) {
            return next(err)
        }
        res.json(projects)
    })
})

module.exports = router
