var db = require('../db')
var Process = new db.Schema({
    name: String
    command: String
    dataTypesRequired: [db.Schema.Types.ObjectId]
})

var ProcessModel = db.model('Process', Process)

module.exports = ProcessModel
