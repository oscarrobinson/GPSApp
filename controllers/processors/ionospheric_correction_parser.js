var fs = require('fs')
var _ = require('underscore')
var readline = require('readline')
var Datatype = require("../../models/datatype")
var Parser = require("../parsers/parserLib/parser")


var OutputParser = function(file) {
    var onLine = function(line, has_datatypes, data, startTime, endTime) {
        if (line[0] != '%') {
            var line = line.split(' ')
            var date1 = line[0].split('/')
            var year = date1[0]
            var month = date1[1]
            var day = date1[2]
            var date2 = line[1].split(':')
            var hours = date2[0]
            var minutes = date2[1]
            var seconds = date2[2]
            var timestamp = new Date(year, month, day, hours, minutes, seconds)
            if (startTime == 0) {

                startTime = timestamp
            }
            endTime = timestamp
            has_datatypes["Ionospheric Corrected Longitude"] = true

            has_datatypes["Ionospheric Corrected Latitude"] = true

            data["Ionospheric Corrected Longitude"].push({
                timestamp: timestamp,
                data: line[7]
            })
            data["Ionospheric Corrected Latitude"].push({
                timestamp: timestamp,
                data: line[4]
            })
        }

        return [has_datatypes, data, startTime, endTime]
    }

    var onClose = function(has_datatypes, data, startTime, endTime) {
        return [has_datatypes, data, startTime, endTime]
    }

    return Parser(file, ["Ionospheric Corrected Longitude", "Ionospheric Corrected Latitude"], ["Ionospheric Corrected Longitude", "Ionospheric Corrected Latitude"], onLine, onClose)

}

module.exports = OutputParser