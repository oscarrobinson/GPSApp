var fs = require('fs')
var _ = require('underscore')
var readline = require('readline')
var Datatype = require("../../models/datatype")

function getTimeFromNmea(line) {
    var corruptArr = line.split(',')
    var timeArr = []
    var foundFirst = false
    for (var i = 0; i < corruptArr.length; i++) {
        if (corruptArr[i].includes("RMC")) {
            foundFirst = true
        }
        timeArr.push(corruptArr[i])
    }
    var time = timeArr[1]
    var date = timeArr[9]
    var year = parseInt(date[4] + date[5]) + 2000
    var month = parseInt(date[2] + date[3])
    var day = parseInt(date[0] + date[1])
    var hour = parseInt(time[0] + time[1])
    var minutes = parseInt(time[2] + time[3])
    var seconds = parseInt(time[4] + time[5])
    return new Date(year, month, day, hour, minutes, seconds)
}

var UbxFile = function(file) {



    //register datatypes looking to mark
    var dt_mark = ["RXM-RAWX", "Latitude", "Longitude"];
    //register datatypes looking to record
    var dt_record = ["Latitude", "Longitude"]


    var has_datatypes = {}
    for (var i = 0; i < dt_mark.length; i++) {
        has_datatypes[dt_mark[i]] = false
    }

    var data_temp = {}
    for (var i = 0; i < dt_record.length; i++) {
        data_temp[dt_record[i]] = []
    }


    var promise = new Promise(function(resolve, reject) {
        var lastTime = ""


        var startTime = 0
        var endTime = 0
        var arr = file.split('/')
        var name = arr[arr.length - 1]
        var datatypes = []
        var data = {}



        const rl = readline.createInterface({
            input: fs.createReadStream(file)
        });



        rl.on('line', function(line) {
            //READ BY LINE AND EXTRACT EVERYTHING WE NEED
            //add all datatypes found in file to datatypes list by their id
            //add any data that will be stored independent of file

            if (line.includes("RMC")) {
                if (!startTime) {
                    startTime = getTimeFromNmea(line)
                }
                lastTime = line
            }

            //extract lat longs from NMEA if have
            if (line.includes("GLL")) {
                has_datatypes["Longitude"] = true
                has_datatypes["Latitude"] = true
                var linesplit = line.split(',')
                var lat_mins = linesplit[1]
                var lon_mins = linesplit[3]
                var longitude = parseInt(lon_mins.substr(0, 2))
                longitude += parseFloat(lon_mins.substr(2, 8)) / 60
                var latitude = parseInt(lat_mins.substr(0, 2))
                latitude += parseFloat(lat_mins.substr(2, 8)) / 60
                if (linesplit[2] == 'S') {
                    latitude = -latitude
                }
                if (linesplit[4] == 'W') {
                    longitude = -longitude
                }
                data_temp["Longitude"].push({
                    timestamp: getTimeFromNmea(lastTime),
                    data: longitude
                })
                data_temp["Latitude"].push({
                    timestamp: getTimeFromNmea(lastTime),
                    data: latitude
                })

            }

            //mark as containing RXM-RAWX
            if (line.includes("\x02\x15") && !has_datatypes["RXM-RAWX"]) {
                has_datatypes["RXM-RAWX"] = true
            }


        });

        function complete(i) {
            if (i < dt_mark.length) {
                if (has_datatypes[dt_mark[i]]) {
                    Datatype.find({ name: dt_mark[i] }, function(err, datatype) {
                        if (data_temp[dt_mark[i]]) {
                            data[datatype[0].id] = data_temp[dt_mark[i]]
                        }
                        datatypes.push(datatype[0].id)
                        complete(i + 1)
                    })
                } else {
                    complete(i + 1)
                }

            } else {
                console.log(name)
                resolve({
                    startTime: startTime,
                    endTime: endTime,
                    name: name,
                    path: file,
                    data: data,
                    datatypes: datatypes
                })

            }
        }


        rl.on('close', function() {
            endTime = getTimeFromNmea(lastTime)
            complete(0)
        })
    })

    return promise

}




module.exports = UbxFile
