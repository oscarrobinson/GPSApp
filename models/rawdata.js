var db = require('../db')


var Data = new db.Schema({
    time: Date,
    value: String
})

var RawData = new db.Schema({
    data: [Data]
})

var RawDataModel = db.model('RawData', RawData)

module.exports = RawDataModel
