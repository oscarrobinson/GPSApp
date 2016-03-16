var db = require('../db')

var Datatype = new db.Schema({
    id: {
        type: Number,
        required: true
    },
    unit: {
        type: String
    },
    name: {
        type: String,
        required: true
    },
    isAverageable: {
        type: Boolean,
        required: true
    }
})

var DatatypeModel = db.model('Datatype', Datatype)

module.exports = DatatypeModel
