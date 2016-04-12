var processor = require('./processorLib/processor')
var fs = require('fs')
var Grid = require('gridfs-stream')
var db = require('../../db')
var _ = require('underscore')
var parser = require('./rtk_positioning_parser')

var Processor = function() {

    var datatypesRequired = ["56e9929b100347700eeceeee"]
    var name = "rtk_positioning"
    var namePretty = "RTK Positioning"
    var extraData = [] // ["fieldName", "fieldName2", ....]


    var baseCommand = "rnx2rtkp"

    var shortId = require('shortId')

    var gfs = Grid(db.connection.db, db.mongo)
    var ephemFilenames = ""
    var obsFilenames = ""
    var inputFile = ""

    var child_process = require('child_process')



    function handleResults(session, outputList, err) {
        //console.log(outputList)


        var outputFiles = []
        for (var i = 0; i < outputList.length; i++) {
            outputFiles.push(outputList[i].output)
        }

        processor.parseOutput(outputFiles, parser).then(function(files) {
            processor.addDataToSession(files, session, outputList, function(session) {

                for (var k = 0; k < session.processes.length; k++) {
                    if (session.processes[k].indexName == name) {
                        if (err) {
                            session.processes[k].runState = "Error"
                        } else {
                            session.processes[k].runState = "Run"
                        }
                        break
                    }
                }
                session.save()

                //delete all temprorary files
                var ephemFilenamesList = _.filter(ephemFilenames.split(" "), function(x) {
                    return (x != "" && x != " ")
                })
                var obsFilenamesList = _.filter(obsFilenames.split(" "), function(x) {
                    return (x != "" && x != " ")
                })

                for (var j = 0; j < ephemFilenamesList.length; j++) {
                    fs.unlink(PROJECT_ROOT + ephemFilenamesList[j], function(err) {
                        if (err) {
                            console.log(err)
                        }
                    })
                }
                for (var j = 0; j < obsFilenamesList.length; j++) {
                    fs.unlink(PROJECT_ROOT + obsFilenamesList[j], function(err) {
                        if (err) {
                            console.log(err)
                        }
                    })
                }
                for (var j = 0; j < outputList.length; j++) {
                    fs.unlink(PROJECT_ROOT + outputList[j].inputFile, function(err) {
                        if (err) {
                            console.log(err)
                        }
                    })
                    var inputUbx = outputList[j].inputFile.split('.')
                    inputUbx[inputUbx.length - 1] = ".ubx"
                    var inputFileUbx = ""
                    for (var l = 0; l < inputUbx.length; l++) {
                        inputFileUbx = inputFileUbx + inputUbx[l]
                    }
                    fs.unlink(PROJECT_ROOT + inputFileUbx, function(err) {
                        if (err) {
                            console.log(err)
                        }
                    })
                }
                processor.deleteTemps(outputList)
            })


        })

    }


    function processInputListBuilder(session, cb) {
        /*
    builds list of process inputs
    {
   		sessionInstanceId: ObjectId
		inputFile: Filepath
		preInputArgs: String
		postInputArgs: String
    }
    */

        var sessionInstances = session.sessionInstances
        var inputList = []

        function iterateSessionInstances(i) {
            if (i < sessionInstances.length) {

                var filename = ""
                for (var j = 0; j < sessionInstances[i].dataFiles.length; j++) {
                    if (sessionInstances[i].dataFiles[j].split(".")[1] == "ubx") {
                        filename = sessionInstances[i].dataFiles[j]
                        break
                    }
                }

                var stream = gfs.createReadStream({ filename: filename });

                //get file out of GridFS into temp file for processing

                var tempName = shortId.generate() + ".ubx"
                var writeStream = fs.createWriteStream(PROJECT_ROOT + "temp/" + tempName)
                stream.pipe(writeStream)
                writeStream.on('close', function(file) {

                    var convbin = child_process.spawn('convbin', [PROJECT_ROOT + "temp/" + tempName])


                    convbin.on('close', function(code) {
                        if (code == '0') {

                            inputFile = "./temp/" + tempName.split('.')[0] + ".obs"
                            inputList.push({
                                sessionInstanceId: sessionInstances[i]._id,
                                inputFile: inputFile,
                                preInputArgs: "-c -t -u",
                                postInputArgs: obsFilenames + ephemFilenames
                            })
                            iterateSessionInstances(i + 1)
                        }
                    })



                })
            } else {
                processor.run(name, session, baseCommand, inputList, handleResults)
                cb(true)
            }
        }
        iterateSessionInstances(0)
    }

    function obsStringBuilder(session, cb) {
        function iterate(i) {
            if (i < session.obsFiles.length) {
                var name = session.obsFiles[i]
                var tempName = shortId.generate() + ".o"
                var stream = gfs.createReadStream({ filename: name });
                var writeStream = fs.createWriteStream("./temp/" + tempName)
                stream.pipe(writeStream)
                writeStream.on('close', function(file) {
                    obsFilenames = obsFilenames + " " + "./temp/" + tempName
                    iterate(i + 1)
                })
            } else {
                processInputListBuilder(session, cb)
            }
        }

        iterate(0)
    }


    function ephemStringBuilder(session, cb) {
        function iterate(i) {
            if (i < session.navFiles.length) {
                var name = session.navFiles[i]
                var tempName = shortId.generate() + ".n"
                var stream = gfs.createReadStream({ filename: name });
                var writeStream = fs.createWriteStream("./temp/" + tempName)
                stream.pipe(writeStream)
                writeStream.on('close', function(file) {
                    ephemFilenames = ephemFilenames + " " + "./temp/" + tempName
                    iterate(i + 1)
                })
            } else {
                obsStringBuilder(session, cb)
            }
        }

        iterate(0)
    }


    function start(session, extraDataIn, cb) {
        for (var i = 0; i < extraData; i++) {
            if (!extraDataIn[extraData[i]]) {
                cb(false)
                return
            }
        }
        if (session.obsFiles && session.navFiles) {
            ephemStringBuilder(session, cb)
        } else {
            cb(false)
        }
    }


    return {
        datatypesRequired: datatypesRequired,
        name: name,
        namePretty: namePretty,
        extraData: extraData,
        start: start
    }
}

module.exports = Processor