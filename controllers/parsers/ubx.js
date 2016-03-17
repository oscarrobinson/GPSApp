var fs = require('fs')
var _ = require('underscore')
var readline = require('readline')
var Datatype = require("../../models/datatype")
var Parser = require("./parserLib/parser")


var UbxFile = function(file) {
    var onLine = function(line, has_datatypes, data, startTime, endTime) {
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


        if (line.includes("RMC")) {
            var lastTimeRead = getTimeFromNmea(line)
            if (!startTime) {
                startTime = lastTimeRead
            }
            endTime = lastTimeRead
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
            data["Longitude"].push({
                timestamp: endTime,
                data: longitude
            })
            data["Latitude"].push({
                timestamp: endTime,
                data: latitude
            })

        }

        //mark as containing RXM-RAWX
        if (line.includes("\x02\x15") && !has_datatypes["RXM-RAWX"]) {
            has_datatypes["RXM-RAWX"] = true
        }

        return [has_datatypes, data, startTime, endTime]
    }

    var onClose = function(has_datatypes, data, startTime, endTime) {
        return [has_datatypes, data, startTime, endTime]
    }

    return Parser(file, ["RXM-RAWX", "Latitude", "Longitude"], ["Latitude", "Longitude"], onLine, onClose)

}

module.exports = UbxFile
