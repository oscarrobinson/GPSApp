db = require('mongoose')

db.connect('mongodb://localhost/gpsapp', function() {
    console.log('mongodb connected')
})
module.exports = db
