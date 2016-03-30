var db = require('../db')

var DataHour = new db.Schema({
    startHour: Date,
    dataReference: db.Schema.Types.ObjectId,
    average: Number
})


var SessionInstanceData = new db.Schema({

    typeId: db.Schema.Types.ObjectId,
    startTime: Date,
    endTime: Date,
    dataList: [DataHour]
})


var SessionInstance = new db.Schema({
    instanceId: db.Schema.Types.ObjectId,
    dataFiles: [String],
    sessionInstanceData: [SessionInstanceData]

})

var Process = new db.Schema({
    name: String,
    indexName: String,
    runState: String, //Not Run, Running, Run
    instancesProcessed: Number
})

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
    },
    sessionInstances: {
        type: [SessionInstance]
    },
    processes: {
        type: [Process]
    },
    obsFiles: {
        type: [String]
    },
    navFiles: {
        type: [String]
    }
    //ephemerisFiles
    //obsFiles

})

var SessionModel = db.model('Session', Session)

module.exports = SessionModel