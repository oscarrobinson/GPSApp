db = require('mongoose')

mongoose.connect('mongodb://localhost/gpsapp', function() {
    console.log('mongodb connected')
})
module.exports = mongoose
