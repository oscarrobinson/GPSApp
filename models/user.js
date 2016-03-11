var db = require('../db')

var User = new db.Schema({
    email: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }

})

var UserModel = db.model('User', User)

module.exports = UserModel
