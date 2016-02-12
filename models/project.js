var db = require('../db')

var TemplateField = new db.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    }
}, {
    strict: true
})

var Template = new db.Schema({
    name: {
        type: String,
        required: true
    },
    fields: {
        type: [TemplateField],
        required: false
    }

}, {
    strict: true
})

function toString(input) {
    return JSON.stringify(input)
}

function toObj(out) {
    return JSON.parse(out)
}

var Instance = new db.Schema({
    id: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    //expects js object in and saves as json string
    //spits out js object with getter
    fields: {
        type: String,
        required: false,
        default: "",
        set: toString,
        get: toObj
    }

}, {
    strict: true
})

var Project = new db.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false,
        default: ""
    },
    templates: {
        type: [Template],
        required: false
    },
    instances: {
        type: [Instance],
        required: false
    }
}, {
    strict: true
})

var ProjectModel = db.model('Project', Project)

module.exports = ProjectModel
