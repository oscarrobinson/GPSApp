var Session = require('../../../models/session')
var Datatype = require('../../../models/datatype')
var child_process = require('child_process')
var _ = require('underscore')
var shortId = require('shortId')
var fs = require('fs')
var RawData = require('../../../models/rawdata')

var processor = (function() {

    function run(name, session, baseCommand, inputList, resultsHandler) {

        function runRecurse(i) {

            if (i < inputList.length) {
                var argsList = inputList[i].preInputArgs.split(' ')
                argsList = argsList.concat(PROJECT_ROOT + inputList[i].inputFile)
                argsList = argsList.concat(inputList[i].postInputArgs.split(' '))
                argsList = _.filter(argsList, function(x) {
                    return x != ''
                })
                for (var j = 0; j < argsList.length; j++) {
                    if (argsList[j][0] == '.') {
                        argsList[j] = PROJECT_ROOT + argsList[j]
                    }
                }


                var outputFile = PROJECT_ROOT + "temp/" + shortId.generate() + ".txt"
                var outputFileStream = fs.createWriteStream(outputFile)
                var runningProcess = child_process.spawn(baseCommand, argsList);
                runningProcess.stdout.pipe(outputFileStream)
                runningProcess.stderr.on('data', function(data) {});

                runningProcess.on('close', function(code) {
                    if (code != 0) {
                        return resultsHandler(session, inputList, true)
                    }
                    outputFileStream.close()
                    inputList[i]["output"] = outputFile
                        //console.log(code);
                    for (var k = 0; k < session.processes.length; k++) {
                        if (session.processes[k].indexName == name) {
                            session.processes[k].instancesProcessed += 1
                            break
                        }
                    }

                    session.save(function(err) {
                        return runRecurse(i + 1)
                    })
                });
            } else {
                //mark session processing as complete
                return resultsHandler(session, inputList, false);
            }

        }


        runRecurse(0)


    }


    function deleteTemps(outputList) {
        for (var i = 0; i < outputList.length; i++) {
            fs.unlink(outputList[i].output, function(err) {
                if (err) {
                    console.log(err)
                }
            })
        }
    }

    function parseOutput(outputFiles, parser) {
        var promises = []
        for (var i = 0; i < outputFiles.length; i++) {
            promises.push(parser(outputFiles[i]))
        }
        return Promise.all(promises)
    }

    function addDataToSession(parsedOutput, session, outputList, cb) {
        for (var i = 0; i < parsedOutput.length; i++) {
            //get sessionInstance id for the output
            for (var j = 0; j < outputList.length; j++) {
                if (outputList[j].output === parsedOutput[i].path) {
                    parsedOutput[i]["sessionInstance"] = outputList[j].sessionInstanceId
                }
            }
        }

        //add new datatypes to session
        session.commonDataTypes = session.commonDataTypes.concat(parsedOutput[0].datatypes)

        //build a list of SessionInstanceData interim objects
        var sessionInstanceDatas = []
        for (var i = 0; i < parsedOutput.length; i++) {
            for (var j = 0; j < parsedOutput[i].datatypes.length; j++) {

                var data = parsedOutput[i].data[parsedOutput[i].datatypes[j]]
                var sessionInstanceData = {
                    startTime: parsedOutput[i].startTime,
                    endTime: parsedOutput[i].endTime,
                    data: data,
                    typeId: parsedOutput[i].datatypes[j],
                    sessionInstanceId: parsedOutput[i].sessionInstance

                }
                sessionInstanceDatas.push(sessionInstanceData)
            }
        }

        function saveHoursAsRawData(sessionInstanceData, dataHours, cbS) {

            var finalSessionInstanceData = {
                typeId: sessionInstanceData.typeId,
                startTime: sessionInstanceData.startTime,
                endTime: sessionInstanceData.endTime,
                dataList: []
            }

            function recursivelySaveDataHours(i) {
                if (i < dataHours.length) {
                    var dataHour = dataHours[i]
                    var finalDataHour = {}
                    if (dataHour["average"]) {
                        finalDataHour = {
                            startHour: dataHour.startHour,
                            average: dataHour.average,
                            dataReference: ""
                        }
                    } else {
                        finalDataHour = {
                            startHour: dataHour.startHour,
                            dataReference: ""
                        }
                    }
                    rawData = new RawData({
                        data: []
                    })
                    for (var j = 0; j < dataHour.data.length; j++) {
                        var rawdataData = {
                            time: dataHour.data[j].timestamp,
                            value: dataHour.data[j].data
                        }
                        rawData.data.push(rawdataData)
                    }

                    rawData.save(function(err, rawData) {
                        finalDataHour.dataReference = rawData._id
                        finalSessionInstanceData.dataList.push(finalDataHour)
                        recursivelySaveDataHours(i + 1)
                    })
                } else {
                    for (var j = 0; j < session.sessionInstances.length; j++) {
                        if (session.sessionInstances[j]._id == sessionInstanceData.sessionInstanceId) {
                            session.sessionInstances[j].sessionInstanceData.push(finalSessionInstanceData)
                        }
                    }
                    cbS()
                }
            }

            recursivelySaveDataHours(0)
        }


        function splitIntoHours(i) {
            if (i < sessionInstanceDatas.length) {
                var sessionInstanceData = sessionInstanceDatas[i]
                Datatype.findById(sessionInstanceData.typeId, function(err, datatype) {
                    var averageable = datatype.isAverageable
                    var dataHours = []
                    var currentHourData = []
                    var thisHour = sessionInstanceData.data[0].timestamp.getHours()
                    var totalForHour = 0;
                    var countForHour = 0;
                    for (var j = 0; j < sessionInstanceData.data.length; j++) {
                        var data = sessionInstanceData.data[j]
                        if (thisHour != data.timestamp.getHours()) {
                            thisHour = data.timestamp.getHours()
                            var d = currentHourData[0].timestamp
                            var startHour = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours())
                            if (averageable) {
                                dataHours.push({
                                    startHour: startHour,
                                    data: currentHourData,
                                    average: totalForHour / countForHour
                                })
                            } else {
                                dataHours.push({
                                    startHour: startHour,
                                    data: currentHourData
                                })
                            }
                            currentHourData = [data]
                            thisHour = data.timestamp.getHours()
                            if (averageable) {
                                totalForHour = parseFloat(data.data)
                                countForHour = 1
                            }
                        } else {
                            currentHourData.push(data)
                            if (averageable) {
                                totalForHour += parseFloat(data.data)
                                countForHour += 1
                            }
                        }
                    }
                    var d = currentHourData[0].timestamp
                    var startHour = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours())
                    if (averageable) {
                        dataHours.push({
                            startHour: startHour,
                            data: currentHourData,
                            average: totalForHour / countForHour
                        })
                    } else {
                        dataHours.push({
                            startHour: startHour,
                            data: currentHourData
                        })
                    }

                    saveHoursAsRawData(sessionInstanceData, dataHours, function() {
                        splitIntoHours(i + 1)
                    })

                })

            } else {
                session.save(function(err, session) {
                    cb(session)
                })
            }
        }

        splitIntoHours(0)

    }

    return {
        run: run,
        deleteTemps: deleteTemps,
        parseOutput: parseOutput,
        addDataToSession: addDataToSession
    }
})()

module.exports = processor