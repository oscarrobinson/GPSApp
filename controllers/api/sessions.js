var Project = require("../../models/project")
var Session = require("../../models/session")
var router = require('express').Router()
var multer = require('multer')
var fs = require('fs')
var parse = require('csv-parse')
var ObsFile = require('../parsers/gpshelpers/obs')
var NavFile = require('../parsers/gpshelpers/nav')
var _ = require('underscore')

var upload = multer({
    dest: 'uploads/'
})
var unzip = require('unzip2')



function parseFile(filePath) {
    var file = undefined
    var fileSplit = filePath.split('.')
    var fileType = fileSplit[fileSplit.length - 1]
    for (var i = 0; i < PARSERS.length; i++) {
        if (PARSERS[i] == fileType) {
            var Parser = require('../parsers/' + fileType)
            var file = new Parser(filePath)
        }
    }
    return file
}

router.post('/api/projects/:id/sessions', upload.array('files', 4), function(req, res, next) {

    //req.files always in order zip,csv,obs,ephem
    var zipFile = req.files[0]
    var csvFile = req.files[1]
    var obsFile = req.files[2]
    var ephemFile = req.files[3]
        //check have all files
    if (!obsFile) {
        return res.sendStatus(400)
    }
    if (!ephemFile) {
        return res.sendStatus(400)
    }
    if (!zipFile) {
        return res.sendStatus(400)
    }
    if (!csvFile) {
        return res.sendStatus(400)
    }
    if (zipFile.mimetype === 'application/zip') {
        fs.createReadStream(zipFile.path).pipe(unzip.Extract({
            path: zipFile.path + 'extract'
        }).on('close', function() {

            fs.readdir(PROJECT_ROOT + zipFile.path + 'extract', function(err, files) {
                //iterate over filenames and decide what to do with each one
                var dataStartTime = 1000000000000000000
                var dataEndTime = 0
                    //for each filetype, must populate this with sensor ids we have data for
                var sensorIds = []
                for (var i = 0; i < files.length; i++) {
                    var filePath = PROJECT_ROOT + zipFile.path + 'extract/' + files[i]
                    var fileSplit = files[i].split('.')
                    var file = parseFile(filePath)
                    var fStart = file.startTime
                    dataStartTime = fStart < dataStartTime ? fStart : dataStartTime
                    var fEnd = file.endTime
                    dataEndTime = fEnd > dataEndTime ? fEnd : dataEndTime
                    sensorIds.push(fileSplit[0])

                    //future file types go here in else if blocks
                }

                var obsObj = new ObsFile(PROJECT_ROOT + obsFile.path, function(file) {
                    var obsStartTime = file.startTime
                    var obsEndTime = file.endTime

                    var navObj = new NavFile(PROJECT_ROOT + ephemFile.path, function(file) {
                        var navStartTime = file.startTime
                        var navEndTime = file.endTime
                        var obsOkay = dataEndTime <= obsEndTime && dataStartTime >= obsStartTime
                        var navOkay = dataEndTime <= navEndTime && dataStartTime >= navStartTime
                        if (obsOkay && navOkay) {
                            var haveAllFiles = true
                            var parser = parse({ delimiter: ',' }, function(err, data) {
                                var sensorIdsExpected = []
                                var instancesExpected = []
                                for (var i = 1; i < data.length; i++) {
                                    instancesExpected.push(data[i][0])
                                    var ids = data[i][1].split(';')
                                    for (var z = 0; z < ids.length; ids++) {
                                        sensorIdsExpected.push(ids[z])
                                    }
                                }
                                if (!_.isEqual(sensorIdsExpected, sensorIds)) {
                                    return res.status(400).send("Missing Data")
                                }

                                //check auth and check project has all instances we wanna save data for
                                Project.findOne({
                                    _id: req.params.id
                                }, function(err, project) {
                                    if (err) {
                                        return res.sendStatus(400)
                                    }
                                    if (project.user != req.auth.id) {
                                        return res.sendStatus(401)
                                    }

                                    for (var i = 0; i < project.instances.length; i++) {
                                        if (!_.contains(instancesExpected, project.instances[i].id.toString())) {
                                            return res.status(400).send("No Instance")
                                        }
                                    }


                                    //TODO: store ephemeris and observation files for session in GridFS
                                    //TODO: delete ephm and obs raw files
                                    //TODO: Store raw data files in DB
                                    //TODO: create session 
                                    //TODO: Store raw data in DB for each instance file
                                    //          for this only type we need is nmeaLatLong
                                    //TODO: Get available datatypes and add process options to session
                                    //TODO: Delete temp CSV file
                                    //TODO: Delete  temp raw dat a files


                                    var session = new Session({
                                        project: req.params.id,
                                        startTime: dataStartTime,
                                        endTime: dataEndTime
                                    })
                                    session.save(function(err, result) {
                                        if (err) {
                                            return res.sendStatus(500)
                                        } else {
                                            return res.status(201).json(result)
                                        }
                                    })
                                })


                            });
                            fs.createReadStream(PROJECT_ROOT + csvFile.path).pipe(parser);
                        } else if (!obsOkay) {
                            return res.status(400).send("OBS Range")
                        } else if (!navOkay) {
                            return res.status(400).send("NAV Range")

                        }
                    })

                })

            })
        }));


    } else {
        return res.sendStatus(400)
    }

})

router.get('/api/projects/:id/sessions', function(req, res, next) {
    Session.find({ project: req.params.id }, function(err, sessions) {
        if (err) {
            return res.sendStatus(500)
        }
        return res.send(sessions)
    })
})

module.exports = router
