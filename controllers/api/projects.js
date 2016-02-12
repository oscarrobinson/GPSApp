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
        res.status(201).json(project)
    })
})

router.get('/api/projects/:id', function(req, res, next) {
    Project.findOne({
        _id: req.params.id
    }, function(err, project) {
        if (err) {
            return next(err)
        }
        res.status(200).json(project)
    })
})




router.delete('/api/projects/:id', function(req, res, next) {
    Project.remove({
        _id: req.params.id
    }, function(err) {
        if (err) {
            res.status(404).send('Project Not Found')
        }
        res.status(201).json()
    })
})



module.exports = router
