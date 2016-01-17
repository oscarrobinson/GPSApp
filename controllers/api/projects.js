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

router.post('/api/projects', function(req, res, next) {
    var project = new Project({
        name: req.body.name,
        description: req.body.description
    })
    project.save(function(err, project) {
        if (err) {
            return next(err)
        }
        res.json(201, project)
    })
})

router.get('/api/projects/:id', function(req, res, next) {
    Project.find({
        _id: req.params.id
    }, function(err, project) {
        if (err) {
            return next(err)
        }
        res.json(project)
    })
})

router.delete('/api/projects/:id', function(req, res, next) {
    Project.remove({
        _id: req.params.id
    }, function(err) {
        if (err) {
            return next(err)
        }
        res.json(201)
    })
})

module.exports = router
