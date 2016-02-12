var Project = require("../../models/project")
var router = require('express').Router()
var csv = require('csv')

router.post('/api/projects/:id/instances', function(req, res, next) {
    Project.findById(req.params.id, function(err, project) {
        if (err) {
            return next(err)
        }
        var max = 0;
        var templates = project.templates.toObject()
        var template
        for (var i = 0; i < templates.length; i++) {
            var t = templates[i]
            if (t.name === req.body.type) {
                template = t
                break
            }
        }
        var check = ""
        if (template) {
            for (var i = 0; i < template.fields.length; i++) {
                var field = template.fields[i]
                    //just check we filled all fields
                check = req.body.fields[field.name]
                if (check === "") {
                    check = "OK"
                }

            }
            if (project.instances.length > 0) {
                for (var i = 0; i < project.instances.length; i++) {
                    if (project.instances[i].id > max) {
                        max = project.instances[i].id
                    }
                }
            }
            max++
            project.instances.push({
                type: req.body.type,
                fields: req.body.fields,
                id: max
            })
        }
        if (!template) {
            res.status(400).send('No Template')
            return

        } else if (!check) {
            res.status(400).send('Missing Field')
            return
        }

        project.save(function(err, result) {
            if (err) {
                console.log(err)
                res.status(400).send('Incorrect Data')
            } else {
                res.status(201).json(result)
            }
        })
    })
})

router.put('/api/projects/:id/instances/:instanceId', function(req, res, next) {
    Project.findById(req.params.id, function(err, project) {
        if (err) {
            return next(err)
        }
        var instance = project.instances.id(req.params.instanceId);
        instance.fields = req.body.fields
        project.save(function(err, result) {
            if (err) {
                res.status(400).send('Incorrect Data')
            } else {
                res.status(201).json(result)
            }
        })
    })
})

router.get('/api/projects/:id/instances/csv', function(req, res, next) {
    Project.findOne({
        _id: req.params.id
    }, function(err, project) {
        var instances = project.instances.toObject()
        var headers = ['id'].concat(Object.keys(JSON.parse(instances[0].fields)))
        console.log(headers)
        var csvData = [headers]
        for (var i = 0; i < instances.length; i++) {
            var row = [instances[i].id]
            var item = JSON.parse(instances[i].fields)
            for (var j = 1; j < headers.length; j++) {
                row.push(item[headers[j]])
            }
            csvData.push(row)
        }
        res.attachment('data.csv')
        csv().from(csvData).to(res);

    })
})

router.get('/api/projects/:id/instances/csv-upload', function(req, res, next) {
    Project.findOne({
        _id: req.params.id
    }, function(err, project) {

        var instances = project.instances.toObject()
        var headers = ['instance_id', 'sensor_id']
        console.log(headers)
        var csvData = [headers]
        for (var i = 0; i < instances.length; i++) {
            var row = [instances[i].id, 'N/A']
            csvData.push(row)
        }
        res.attachment('data.csv')
        csv().from(csvData).to(res);
    })
})

router.get('/api/projects/:id/instances/:instanceId', function(req, res, next) {
    Project.findOne({
        _id: req.params.id
    }, function(err, project) {
        var instance = project.instances.id(req.params.instanceId)
        res.status(200).json(instance)
    })
})

module.exports = router
