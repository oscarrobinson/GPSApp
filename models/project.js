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
    }
}, {
    strict: true
})
var ProjectModel = db.model('Project', Project)

module.exports = ProjectModel
