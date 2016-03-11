var Project = require("../../models/project")
var router = require('express').Router()

router.get('/api/projects', function(req, res, next) {
    Project.find({
        user: req.auth.id
    }, function(err, projects) {
        if (err) {
            return next(err)
        }
        res.json(projects)
    })
})

router.post('/api/projects', function(req, res, next) {
    var project = new Project({
        name: req.body.name,
        description: req.body.description,
        user: req.auth.id

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
        if (project.user != req.auth.id) {
            return res.sendStatus(401)
        }
        res.status(200).json(project)
    })
})




router.delete('/api/projects/:id', function(req, res, next) {
    Project.remove({
        _id: req.params.id,
        user: req.auth.id
    }, function(err, removed) {
        if (err) {
            return res.status(404).send('Project Not Found')
        }
        if (!removed) {
            return res.sendStatus(401)
        }
        res.status(201).json()
    })
})



module.exports = router
