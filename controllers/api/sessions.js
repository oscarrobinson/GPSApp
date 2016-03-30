var Project = require("../../models/project")
var Session = require("../../models/session")
var Datatype = require("../../models/datatype")
var db = require('../../db')
var router = require('express').Router()
var multer = require('multer')
var fs = require('fs')
var parse = require('csv-parse')
var ObsFile = require('../parsers/gpshelpers/obs')
var NavFile = require('../parsers/gpshelpers/nav')
var _ = require('underscore')
var shortId = require('shortid');
var Grid = require('gridfs-stream')
var RawData = require("../../models/rawdata")
var json2csv = require("json2csv")
var rimraf = require("rimraf")
var upload = multer({
    dest: 'uploads/'
})
var unzip = require('unzip2')
var ZipFile = require('jszip')

var gfs = Grid(db.connection.db, db.mongo)




router.post('/api/projects/:id/sessions', upload.array('files', 4), function(req, res, next) {

    function parseFiles(filepaths) {
        var promises = []
        var noErrors = true
        for (var j = 0; j < filepaths.length; j++) {
            var filePath = filepaths[j]
            var fileSplit = filePath.split('.')
            var fileType = fileSplit[fileSplit.length - 1]
            var parserFound = false
            for (var i = 0; i < PARSERS.length; i++) {
                if (PARSERS[i] == fileType) {
                    var Parser = require('../parsers/' + fileType)
                    promises.push(Parser(filePath))
                    parserFound = true
                    break
                }
            }
            if (!parserFound) {
                noErrors = false
                break
            }
        }
        if (noErrors) {
            return Promise.all(promises)
        } else {
            return new Promise(function(resolve, reject) {
                reject("No Parser for file")
            })
        }
    }

    function deleteAllTempFiles(cb) {
        function deleteFiles(i) {
            if (i < filesToDelete.length) {
                fs.unlink(filesToDelete[i], function(err) {
                    if (err) {
                        cb(err)
                    }
                    deleteFiles(i + 1)
                })
            } else {
                cb()
            }

        }
        if (dirToDelete) {
            rimraf(dirToDelete, function(err) {
                if (err) {
                    cb(err)
                }
                deleteFiles(0)
            })
        } else {
            deleteFiles(0)
        }
    }


    //lots of functions in here to avoid nested callback hell
    //thanks to http://callbackhell.com/ for the idea
    //init vars we're gonna put data into to save later
    var commonDataTypes = []
    var dataStartTime = 1000000000000000000
    var dataEndTime = 0
    var obsFilename = shortId.generate() + '.txt'
    var navFilename = shortId.generate() + '.txt'
    var sessionInstances = []
    var processes = []


    var filesToDelete = []
    var dirToDelete

    //temp variables
    var obsEndTime = 0
    var obsStartTime = 0
    var sensorIds = []
    var sensorIdsExpected = []
    var instancesExpected = []
    var instances = []
    var parsedFiles = []
    var instanceToFileMap = {}

    //req.files always in order zip,csv,obs,ephem
    var zipFile = req.files[0]
    var csvFile = req.files[1]
    var obsFile = req.files[2]
    var ephemFile = req.files[3]

    for (var i = 0; i < req.files.length; i++) {
        filesToDelete.push(PROJECT_ROOT + req.files[i].path)
    }

    var noErrors = true
    var resSent = false
        //check have all files
    if (!obsFile) {
        noErrors = false
        deleteAllTempFiles(function(err) {
            if (err) {
                console.log(err)
            }
        })
        return res.sendStatus(400)
    }
    if (!ephemFile) {
        noErrors = false
        deleteAllTempFiles(function(err) {
            if (err) {
                console.log(err)
            }
        })
        return res.sendStatus(400)
    }
    if (!zipFile) {
        noErrors = false
        deleteAllTempFiles(function(err) {
            if (err) {
                console.log(err)
            }
        })
        return res.sendStatus(400)
    }
    if (!csvFile) {
        noErrors = false
        deleteAllTempFiles(function(err) {
            if (err) {
                console.log(err)
            }
        })
        return res.sendStatus(400)
    }
    if (zipFile.mimetype === 'application/zip') {
        if (noErrors) {
            unzipFile()
        } else {
            deleteAllTempFiles(function(err) {
                if (err) {
                    console.log(err)
                }
            })
            return res.sendStatus(400)
        }
    } else {
        noErrors = false
        deleteAllTempFiles(function(err) {
            if (err) {
                console.log(err)
            }
        })
        return res.sendStatus(400)
    }

    function unzipFile() {
        fs.createReadStream(zipFile.path).pipe(unzip.Extract({
            path: zipFile.path + 'extract'
        })).on('close', readUnzipDir)
    }

    function readUnzipDir(err) {
        if (err) {
            deleteAllTempFiles(function(err) {
                if (err) {
                    console.log(err)
                }
            })
            return res.sendStatus(500)
        } else {
            dirToDelete = PROJECT_ROOT + zipFile.path + 'extract'
            fs.readdir(PROJECT_ROOT + zipFile.path + 'extract', processFiles)
        }
    }

    function processFiles(err, files) {
        //iterate over filenames and decide what to do with each one
        //for each filetype, must populate this with sensor ids we have data for
        if (err) {
            deleteAllTempFiles(function(err) {
                if (err) {
                    console.log(err)
                }
            })
            return res.sendStatus(500)
        } else {
            var filepaths = []
            for (var i = 0; i < files.length; i++) {
                filepaths.push(PROJECT_ROOT + zipFile.path + 'extract/' + files[i])
            }
            parseFiles(filepaths).then(function(files) {
                parsedFiles = files
                for (var i = 0; i < files.length; i++) {
                    var file = files[i]
                    if (i == 0) {
                        commonDataTypes = file.datatypes
                    }
                    if (i != 0) {
                        for (var j = 0; j < file.datatypes.length; j++) {
                            if (!_.contains(commonDataTypes, file.datatypes[j])) {
                                commonDataTypes = _.without(commonDataTypes, file.datatypes[j])
                            }
                        }
                    }
                    var arr = file.name.split('.')
                    var nameNoExtension = arr[0]
                    dataStartTime = file.startTime < dataStartTime ? file.startTime : dataStartTime
                    dataEndTime = file.endTime > dataEndTime ? file.endTime : dataEndTime
                    sensorIds.push(nameNoExtension)
                }

                new ObsFile(PROJECT_ROOT + obsFile.path, getObsParams)
            }).catch(function(err) {
                deleteAllTempFiles(function(err) {
                    if (err) {
                        console.log(err)
                    }
                })
                return res.sendStatus(400)
            })
        }
    }

    function getObsParams(file) {
        obsStartTime = file.startTime
        obsEndTime = file.endTime

        new NavFile(PROJECT_ROOT + ephemFile.path, getNavParams)

    }

    function getNavParams(file) {
        var navStartTime = file.startTime
        var navEndTime = file.endTime
        var obsOkay = dataEndTime <= obsEndTime && dataStartTime >= obsStartTime
        var navOkay = dataEndTime <= navEndTime && dataStartTime >= navStartTime
        if (obsOkay && navOkay) {
            var haveAllFiles = true
            var parser = parse({ delimiter: ',' }, validateFromCSV)
            fs.createReadStream(PROJECT_ROOT + csvFile.path).pipe(parser);
        } else if (!obsOkay) {
            deleteAllTempFiles(function(err) {
                if (err) {
                    console.log(err)
                }
            })
            return res.status(400).send("OBS Range")
        } else if (!navOkay) {
            deleteAllTempFiles(function(err) {
                if (err) {
                    console.log(err)
                }
            })
            return res.status(400).send("NAV Range")
        }

    }

    function validateFromCSV(err, data) {
        if (err) {
            return res.sendStatus(500)
        } else {
            for (var i = 1; i < data.length; i++) {
                instanceToFileMap[data[i][0]] = data[i][1].split(';')
                instancesExpected.push(data[i][0])
                var ids = data[i][1].split(';')
                for (var z = 0; z < ids.length; ids++) {
                    sensorIdsExpected.push(ids[z])
                }
            }
            if (!_.isEqual(sensorIdsExpected, sensorIds)) {

                deleteAllTempFiles(function(err) {
                    if (err) {
                        console.log(err)
                    }
                })
                return res.status(400).send("Missing Data")

            }

            //check auth and check project has all instances we wanna save data for
            Project.findOne({
                _id: req.params.id
            }, addObsToProject)
        }
    }

    function addObsToProject(err, project) {
        if (err) {
            deleteAllTempFiles(function(err) {
                if (err) {
                    console.log(err)
                }
            })
            return res.sendStatus(400)
        } else {
            if (project.user != req.auth.id) {
                deleteAllTempFiles(function(err) {
                    if (err) {
                        console.log(err)
                    }
                })
                return res.sendStatus(401)
            } else {

                for (var i = 0; i < project.instances.length; i++) {
                    if (!_.contains(instancesExpected, project.instances[i].id.toString())) {

                        deleteAllTempFiles(function(err) {
                            if (err) {
                                console.log(err)
                            }
                        })
                        return res.status(400).send("No Instance")
                    }
                }

                instances = project.instances

                var write_stream = gfs.createWriteStream({ filename: obsFilename });
                var read_stream = fs.createReadStream(PROJECT_ROOT + obsFile.path);
                read_stream.pipe(write_stream)
                write_stream.on('close', function(file) {
                    addNavToProject()
                })

            }
        }
    }

    function addNavToProject() {
        var write_stream = gfs.createWriteStream({ filename: navFilename });
        var read_stream = fs.createReadStream(PROJECT_ROOT + ephemFile.path);
        read_stream.pipe(write_stream)
        write_stream.on('close', function(file) {
            createSessionInstances()
        })
    }

    function createSessionInstances() {

        var filesToSave = []
            //build sessionInstances
        for (var i = 0; i < instancesExpected.length; i++) {
            var sessionInstance = {}
            var instance
                //get instance data from project instance record
            for (var j = 0; j < instances.length; j++) {
                if (instances[j].id == instancesExpected[i]) {
                    instance = instances[j]
                }
            }
            var filenames = instanceToFileMap[instancesExpected[i]]
            var instance_files = []
                //get the parsed data files that are data for this instance
            for (var x = 0; x < filenames.length; x++) {
                for (var y = 0; y < parsedFiles.length; y++) {
                    if (filenames[x] == parsedFiles[y].name.split('.')[0]) {
                        instance_files.push(parsedFiles[y])
                    }
                }
            }

            //start building up the sessionInstance object
            sessionInstance["instanceId"] = instance._id
            sessionInstance["dataFiles"] = []
            sessionInstance["sessionInstanceData"] = []


            //iterate over instance files and add a name to save the raw file under in gridFS, will save later
            for (var j = 0; j < instance_files.length; j++) {
                var savedName = shortId.generate() + "." + instance_files[j].name.split('.')[1]
                sessionInstance["dataFiles"].push(savedName)
                filesToSave.push({ path: instance_files[j].path, name: savedName })
            }
            //format the parsed data for database storage
            //loop over all the parsed files we have for the instance
            for (var j = 0; j < instance_files.length; j++) {
                //in each parsed file, separate the data by datatype for storage
                for (var k = 0; k < instance_files[j].datatypes.length; k++) {
                    if (instance_files[j].data[instance_files[j].datatypes[k]]) {
                        var sessionInstanceData = { typeId: instance_files[j].datatypes[k], startTime: instance_files[j].startTime, endTime: instance_files[j].endTime }
                            //separate the data for the datatype by hour according to the model
                        var dataHours = buildDataList(instance_files[j].data[instance_files[j].datatypes[k]], sessionInstanceData.startTime, sessionInstanceData.endTime)
                        sessionInstanceData["dataList"] = dataHours
                            //add the correctly formatted database data to the sessionInstance
                        sessionInstance["sessionInstanceData"].push(sessionInstanceData)
                    }
                }

            }
            //finally add the correctly formatted object for the sessionInstance to the session
            sessionInstances.push(sessionInstance)
        }
        saveFiles(filesToSave)
    }


    /*
        builds list of all data for a datatype for an instance instance
        returns list dataHours


        dataHours = [
            {
                startHour: Date
                data: [
                    {   
                        timestamp: Date,
                        value: String
                    }
                    ...
                ]
            }
            ...
        ]


        splitData turns data list into a RawData object in the database and replaces the list with an ObjectId

    */
    function buildDataList(data, datatype, startTime, endTime) {
        var totalNumHours = Math.ceil((endTime - startTime) / 1000 / 60 / 60)

        var HOUR = 1000 * 60 * 60

        var dataHours = []


        var dataForHour = []

        var alreadyPushed = false
        var lastHour = data[0].timestamp

        while (data.length > 0) {
            alreadyPushed = false
            var dataPoint = data.shift()
            var dataPointTemp = { time: dataPoint.timestamp, value: dataPoint.data }
            dataPoint = dataPointTemp
            var hour = dataPoint.time
            if (hour.getHours() == lastHour.getHours()) {
                dataForHour.push(dataPoint)
            } else {
                data.unshift(dataPoint)
                dataHours.push({ data: dataForHour, startHour: new Date(hour.getFullYear(), hour.getMonth(), hour.getDate(), hour.getHours()) })
                dataForHour = []
                lastHour = hour
                var alreadyPushed = true
            }
        }
        if (!alreadyPushed) {
            dataHours.push({ data: dataForHour, startHour: new Date(hour.getFullYear(), hour.getMonth(), hour.getDate(), hour.getHours()) })
        }
        return dataHours
    }


    //saves all the raw data files in gridfs
    function saveFiles(filesToSave) {
        if (filesToSave.length > 0) {
            var fileToSave = filesToSave.pop()
            var write_stream = gfs.createWriteStream({ filename: fileToSave.name });
            var read_stream = fs.createReadStream(fileToSave.path);
            read_stream.pipe(write_stream)
            write_stream.on('close', function(file) {
                saveFiles(filesToSave)
            })
        } else {
            //all files saved
            buildIndexList()
        }
    }

    //builds a list of indexes into the sessionInstance->sessionInstanceData->dataList strcuture
    //we use thise list of indexes to recursively save all the dataHours into their own spot in the DB
    function buildIndexList() {
        var dataToSplit = []
        for (var i = 0; i < sessionInstances.length; i++) {
            var sessionInstanceData = sessionInstances[i].sessionInstanceData
            for (var j = 0; j < sessionInstanceData.length; j++) {
                var dataList = sessionInstanceData[j].dataList
                for (var k = 0; k < dataList.length; k++) {
                    //add the indices into the list
                    //si = sessionInstance index
                    //sid = sessionInstanceData index
                    //dl = dataList index
                    dataToSplit.push({ si: i, sid: j, dl: k })
                }
            }
        }
        saveRawData(dataToSplit)
    }


    //recursively go through the list of indices and create save RawData objects
    function saveRawData(dataToSplit) {
        if (dataToSplit.length > 0) {
            var s = dataToSplit.shift()
            var splitting = sessionInstances[s.si].sessionInstanceData[s.sid].dataList[s.dl]
                //data already correctly formatted in each dataList object so just build a new RawData object with it
            var raw = new RawData({
                data: splitting.data
            })
            raw.save(function(err, result) {
                //build a value with ref to rawData object rather than actual data list
                var newVal = { startHour: sessionInstances[s.si].sessionInstanceData[s.sid].dataList[s.dl].startHour, dataReference: result._id }
                Datatype.findById(sessionInstances[s.si].sessionInstanceData[s.sid].typeId, function(err, datatype) {
                    if (datatype.isAverageable) {
                        var total = 0
                        for (var i = 0; i < splitting.data.length; i++) {
                            total += splitting.data[i].value
                        }
                        var average = total / splitting.data.length
                        newVal["average"] = average
                    }
                    //replace the sessionInstances object data with the new value with reference to RawData object
                    sessionInstances[s.si].sessionInstanceData[s.sid].dataList[s.dl] = newVal
                    saveRawData(dataToSplit)
                })
            })

        } else {
            addProcessors()
        }
    }

    //adds the list of processors available given data in the session
    function addProcessors() {
        for (var i = 0; i < PROCESSORS.length; i++) {
            var Processor = require("./../processors/" + PROCESSORS[i])
            var processor = Processor()
            var hasAllDatatypes = true
            for (var j = 0; j < processor.datatypesRequired.length; j++) {
                var found = false
                for (var k = 0; k < commonDataTypes.length; k++) {
                    if (commonDataTypes[k] == processor.datatypesRequired[j]) {
                        found = true
                    }
                }
                if (!found) {
                    hasAllDatatypes = false
                    break
                }
            }
            if (hasAllDatatypes) {
                processes.push({
                    name: processor.namePretty,
                    indexName: processor.name,
                    runState: "Not Run",
                    instancesProcessed: 0
                })
            }
        }
        saveSession()
    }

    function saveSession() {

        var session = new Session({
            project: req.params.id,
            startTime: dataStartTime,
            endTime: dataEndTime,
            obsFiles: [obsFilename],
            navFiles: [navFilename],
            commonDataTypes: commonDataTypes,
            sessionInstances: sessionInstances,
            processes: processes
        })


        session.save(function(err, result) {
            if (err) {
                deleteAllTempFiles(function(err) {
                    return res.sendStatus(500)
                })
            } else {
                deleteAllTempFiles(function(err) {
                    return res.status(201).json(result)
                })
            }
        })
    }
})

router.get('/api/projects/:id/sessions', function(req, res, next) {
    Session.find({ project: req.params.id }, function(err, sessions) {
        if (err) {
            return res.sendStatus(500)
        }
        if (sessions.length > 0) {
            Project.findById(sessions[0].project, function(err, project) {
                if (err) {
                    return res.sendStatus(500)
                }
                if (project.user != req.auth.id) {
                    return res.send(401)
                }
                return res.send(sessions)
            })
        } else {
            return res.send([])
        }
    })
})

router.get('/api/projects/:id/sessions/:sessionId', function(req, res) {
    Session.findById(req.params.sessionId, function(err, session) {
        if (err) {
            return res.sendStatus(500)
        }
        Project.findById(session.project, function(err, project) {
            if (err) {
                return res.sendStatus(500)
            }
            if (project.user != req.auth.id) {
                return res.sendStatus(401)
            }

            function recursivelyAddDatatypes(i) {
                if (i < session.commonDataTypes.length) {
                    Datatype.findById(session.commonDataTypes[i], function(err, d) {
                        if (err) {
                            return res.sendStatus(500)
                        }
                        session["datatypes"].push(d)
                        recursivelyAddDatatypes(i + 1)
                    })
                } else {
                    return res.send(session)
                }
            }
            session = _.extend(session.toObject(), { datatypes: [] })
            recursivelyAddDatatypes(0)


        })
    })
})

router.get('/api/projects/:id/sessions/:sessionId/processProgress', function(req, res) {
    Session.findById(req.params.sessionId, function(err, session) {
        if (err) {
            return res.sendStatus(500)
        }
        Project.findById(session.project, function(err, project) {
            if (err) {
                return res.sendStatus(500)
            }
            if (project.user != req.auth.id) {
                return res.sendStatus(401)
            }

            return res.send(session.processes)

        })
    })
})


router.get('/api/process/:name', function(req, res) {
    var name = req.params.name
    var exists = false
    for (var i = 0; i < PROCESSORS.length; i++) {
        if (PROCESSORS[i] == name) {
            exists = true
            break
        }
    }
    if (exists) {
        var Process = require("../processors/" + name)
        var processFile = Process()
        var processToReturn = {
            name: processFile.name,
            namePretty: processFile.namePretty,
            extraData: processFile.extraData
        }
        return res.send(processToReturn)

    } else {
        return res.sendStatus(404)
    }
})





router.post('/api/projects/:id/sessions/:sessionId/runprocess', function(req, res) {
    Project.findById(req.params.id, function(err, project) {
        if (req.auth.id != project.user) {
            return res.sendStatus(401)
        }
        var processName = req.body.name
        Session.findById(req.params.sessionId, function(err, session) {
            var canRun = false;
            for (var i = 0; i < session.processes.length; i++) {
                if (processName == session.processes[i].indexName) {
                    if (session.processes[i].runState == "Run") {
                        return res.status(400).send("Already Run")
                    }
                    session.processes[i].runState = "Running"
                    canRun = true
                    break
                }
            }
            if (canRun) {
                var extraData = {}
                if (req.body.extraData) {
                    extraData = req.body.extraData
                }
                var Processor = require("./../processors/" + processName)
                var processor = Processor()
                processor.start(session, extraData, function(running) {
                    if (!running) {
                        return res.sendStatus(400)
                    }
                    session.save(function(err) {
                        if (err) {
                            return res.sendStatus(500)
                        }
                        return res.sendStatus(200)
                    })
                })
            } else {
                return res.sendStatus(400)
            }

        })


    })
})


function getDataForInstance(sessionInstance, datatype, cb) {
    var sessionInstanceData
    for (var i = 0; i < sessionInstance.sessionInstanceData.length; i++) {
        var typeId = String(sessionInstance.sessionInstanceData[i].typeId)
        if (typeId === String(datatype)) {
            sessionInstanceData = sessionInstance.sessionInstanceData[i]
            break
        }
    }
    var allData = []

    function getData(i) {
        if (i < sessionInstanceData.dataList.length) {
            RawData.findById(sessionInstanceData.dataList[i].dataReference, function(err, rawdata) {
                allData = allData.concat(rawdata.data)
                getData(i + 1)
            })
        } else {
            cb(allData)
        }
    }
    getData(0)
}


router.get('/api/projects/:id/sessions/:sessionId/getAllDataCsv', function(req, res) {
    Project.findById(req.params.id, function(err, project) {
        if (req.auth.id != project.user) {
            return res.sendStatus(401)
        }
        Session.findById(req.params.sessionId, function(err, session) {
            if (err) {
                return res.sendStatus(500)
            }
            var datatypes = []

            getDatatypes(0)

            function getDatatypes(i) {
                if (i < session.commonDataTypes.length) {
                    Datatype.findById(session.commonDataTypes[i], function(err, datatype) {
                        if (datatype.isStoreable) {
                            datatypes.push(datatype)
                        }
                        getDatatypes(i + 1)
                    })
                } else {
                    getDataForCsvs()
                }
            }

            function getDataForCsvs() {

                var jsonData = {}

                function iterateOverInstances(i) {
                    if (i < session.sessionInstances.length) {
                        var sessionInstance = session.sessionInstances[i]

                        function iterateOverDatatypes(j) {
                            if (j < datatypes.length) {
                                getDataForInstance(sessionInstance, datatypes[j]._id, function(data) {
                                    if (jsonData[sessionInstance.instanceId]) {
                                        for (var k = 0; k < jsonData[sessionInstance.instanceId].length; k++) {
                                            for (var z = 0; z < data.length; z++) {
                                                if (String(data[z].time) === String(jsonData[sessionInstance.instanceId][k].Time)) {
                                                    var datatypeName = datatypes[j].name.replace(/ /g, "_")
                                                    jsonData[sessionInstance.instanceId][k][datatypeName] = data[z].value
                                                }
                                            }
                                        }

                                    } else {
                                        for (var k = 0; k < data.length; k++) {
                                            var datatypeName = datatypes[j].name.replace(/ /g, "_")
                                            dataTemp = {}
                                            dataTemp[datatypeName] = data[k].value
                                            dataTemp["Time"] = data[k].time
                                            data[k] = dataTemp
                                        }
                                        jsonData[sessionInstance.instanceId] = data
                                    }
                                    iterateOverDatatypes(j + 1)
                                })
                            } else {
                                iterateOverInstances(i + 1)
                            }
                        }
                        iterateOverDatatypes(0)


                    } else {
                        buildCsvs(jsonData)
                    }
                }

                iterateOverInstances(0)

            }


            function buildCsvs(data) {
                var csvs = []

                function buildRecurse(i) {
                    if (i < project.instances.length) {
                        if (data[project.instances[i]._id]) {

                            var fields = Object.keys(data[project.instances[i]._id][0])

                            json2csv({ data: data[project.instances[i]._id], fields: fields }, function(err, csv) {
                                if (err) { console.log(err) };
                                csvs.push({ name: "instance-" + project.instances[i].id + ".csv", data: csv })
                                buildRecurse(i + 1)
                            });

                        }
                    } else {
                        var zip = new ZipFile()
                        for (var j = 0; j < csvs.length; j++) {
                            zip.file(csvs[j].name, csvs[j].data)
                        }
                        var filename = PROJECT_ROOT + 'temp/' + shortId.generate() + ".zip"

                        var output = zip.generate({ compression: "DEFLATE", type: "nodebuffer" })

                        fs.writeFile(filename, output, 'binary', function(err) {
                            if (err) {
                                return res.sendStatus(500)
                            } else {
                                return res.sendFile(filename)
                            }
                        })

                    }
                }
                buildRecurse(0)

            }
        })
    })
})


router.delete('/api/projects/:id/sessions/:sessionId', function(req, res, next) {
    Project.findById(req.params.id, function(err, project) {
        if (err) {
            return res.sendStatus(500)
        }
        if (project.user != req.auth.id) {
            return res.sendStatus(401)
        }
        Session.remove({ _id: req.params.sessionId }, function(err, removed) {
            if (err) {
                return res.status(404).send('Session Not Found')
            }
            return res.sendStatus(200)
        })
    })
})

module.exports = router