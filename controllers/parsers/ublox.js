var fs = require('fs')
var _ = require('underscore')

function getTimeFromNmeaBuf(buf) {
    var timeStr = _.map(buf, function(i) {
        return String.fromCharCode(i)
    }).join("")
    var timeArr = timeStr.split(',')
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
    var data = fs.readFileSync(file)
    var buf = [];
    //scan down file until get a start time
    for (var i = 0; i < data.length; i++) {
        //if have a $,is NMEA message so start filling buffer
        if (data[i] == 36) {
            //read ahead and see if we have a time in this message
            var x = i
            for (i = i; i < (x + 6); i++) {
                buf.push(data[i]);
            }
            //doesn't matter what 3rd char is as just denotes GNSS system type received
            buf[2] = 0
                //$GPRMC - almost guaranteed to exist as is minimum NMEA info so see if we have one
            if (_.isEqual(buf, [36, 71, 0, 82, 77, 67])) {
                //we got the first time message, read the rest

                while (data[i] != 36) {
                    buf.push(data[i])
                    i++
                }
                this.startTime = getTimeFromNmeaBuf(buf)
                break
            } else {
                //didnt get an NMEA time message, empty buf and keep scanning
                buf = []
            }
        }
    }
    //scan up file until get an end time
    buf = [];
    var skipDollar = false;
    for (var i = data.length - 1; i > 0; i--) {
        //if have a $,is NMEA message so start filling buffer
        if (data[i] == 36 && !skipDollar) {
            //read ahead and see if we have a time in this message
            var x = i
            for (i = i; i < (x + 6); i++) {
                buf.push(data[i]);
            }
            //doesn't matter what 3rd char is as just denotes GNSS system type received
            buf[2] = 0
                //$GPRMC - almost guaranteed to exist as is minimum NMEA info so see if we have one
            if (_.isEqual(buf, [36, 71, 0, 82, 77, 67])) {
                //we got the first time message, read the rest

                while (data[i] != 36) {
                    buf.push(data[i])
                    i++
                }
                this.endTime = getTimeFromNmeaBuf(buf)
                break
            } else {
                //didnt get an NMEA time message, empty buf and keep scanning
                skipDollar = true
                buf = []
            }
        } else if (data[i] == 36 && skipDollar) {
            if (skipDollar) {
                skipDollar = false
            }
        }
        buf = []
    }


}

module.exports = UbxFile
