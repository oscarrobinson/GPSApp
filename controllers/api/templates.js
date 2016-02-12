var Project = require("../../models/project")
var router = require('express').Router()

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

router.get('/api/projects/:id/templates/:templateId', function(req, res, next) {
    Project.findOne({
        _id: req.params.id
    }, function(err, project) {
        var template = project.templates.id(req.params.templateId)
        res.status(200).json(template)
    })
})

router.get('/api/projects/:id/templates', function(req, res, next) {
    Project.findOne({
        _id: req.params.id
    }, function(err, project) {
        res.status(200).json(project.templates)
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


module.exports = router
