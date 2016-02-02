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

router.post('/api/projects/:id/templates', function(req, res, next) {

    Project.findById(req.params.id, function(err, project) {
        if (err) {
            return next(err)
        }
        project.templates.push({
            name: req.body.name,
            fields: req.body.fields
        })
        project.save(function(err, result) {
            if (err) {
                res.status(400).send('Incorrect Data')
            } else {
                res.status(201).json(result)
            }
        })
    })
})

router.put('/api/projects/:id/templates/:templateId', function(req, res, next) {
    Project.findById(req.params.id, function(err, project) {
        if (err) {
            return next(err)
        }
        var template = project.templates.id(req.params.templateId);
        template.fields = req.body.fields
        template.name = req.body.name
        project.save(function(err, result) {
            if (err) {
                res.status(400).send('Incorrect Data')
            } else {
                res.status(201).json(result)
            }
        })
    })
})

router.get('/api/projects/:id/templates/:templateId', function(req, res, next) {
    Project.findOne({
        _id: req.params.id
    }, function(err, project) {
        var template = project.templates.id(req.params.templateId)
        res.status(200).json(template)
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
