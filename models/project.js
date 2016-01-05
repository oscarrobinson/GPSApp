var db = require('../db')

var Project = db.model('Project', {
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false,
        default: ""
    }
})

module.exports = Project
