var fs = require('fs')
var _ = require('underscore')
var readline = require('readline')
var Datatype = require("../../../models/datatype")


var Parser = function(file, dt_mark, dt_record, onLine, onClose) {

    var has_datatypes = {}
    for (var i = 0; i < dt_mark.length; i++) {
        has_datatypes[dt_mark[i]] = false
    }

    var data_temp = {}
    for (var i = 0; i < dt_record.length; i++) {
        data_temp[dt_record[i]] = []
    }


    var promise = new Promise(function(resolve, reject) {
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
            var lineResult = onLine(line, has_datatypes, data_temp, startTime, endTime)
            has_datatypes = lineResult[0]
            data_temp = lineResult[1]
            startTime = lineResult[2]
            endTime = lineResult[3]
        });

        function complete(i) {
            if (i < dt_mark.length) {
                if (has_datatypes[dt_mark[i]]) {
                    Datatype.find({ name: dt_mark[i] }, function(err, datatype) {
                        if (data_temp[dt_mark[i]]) {
                            data[datatype[0]._id] = data_temp[dt_mark[i]]
                        }
                        datatypes.push(datatype[0]._id)
                        complete(i + 1)
                    })
                } else {
                    complete(i + 1)
                }

            } else {
                if (!startTime || !endTime || !name || !file || !data || !datatypes) {
                    reject("parser error")
                }
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
            var closeResult = onClose(has_datatypes, data_temp, startTime, endTime)
            has_datatypes = closeResult[0]
            data_temp = closeResult[1]
            startTime = closeResult[2]
            endTime = closeResult[3]
            complete(0)
        })
    })

    return promise

}




module.exports = Parser