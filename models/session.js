var db = require('../db')

var Session = new db.Schema({
    project: {
        type: db.Schema.Types.ObjectId,
        required: true
    },
    startTime: {
        type: Date
    },
    endTime: {
        type: Date
    },
    commonDataTypes: {
        type: [db.Schema.Types.ObjectId]
    }
})

var SessionModel = db.model('Session', Session)

module.exports = SessionModel
