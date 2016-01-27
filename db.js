db = require('mongoose')

db.connect('mongodb://localhost/gpsapp')
module.exports = db
