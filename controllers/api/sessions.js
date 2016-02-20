var Project = require("../../models/project")
var router = require('express').Router()
var multer = require('multer')
var fs = require('fs')
var ublox = require('../processors/ublox')

var upload = multer({
    dest: 'uploads/'
})
var unzip = require('unzip2')

router.post('/api/projects/:id/sessions', upload.array('files', 4), function(req, res, next) {
    console.log(req.files)
    //req.files always in order zip,csv,obs,ephem
    var zipFile = req.files[0]
    var csvFile = req.files[1]
    var obsFile = req.files[2]
    var ephemFile = req.files[3]
    if(zipFile.mimetype==='application/zip'){
        console.log("is zip")
        fs.createReadStream(zipFile.path).pipe(unzip.Extract({ path: zipFile.path+'extract' }).on('close', function(){
            fs.readdir(PROJECT_ROOT+zipFile.path+'extract', function(err,files){
                console.log(files)
                //iterate over files and decide what to do with each one
                for(var i=0; i<files.length; i++){
                    //if ublox, name is tied to instance
                    //TODO: Extract data for UBX and save files
                    ublox.test()
                    //if hw file, packets are tied to instance
                    //TODO: Extract data for raw data files
                    //if csv, rows are tied to instance
                    //TODO: Extract data for CSV
                } 
                //TODO: Store data start and end times for later checking of ephem and obs times
                //TODO: Delete temp files after successful extraction
            })
        }));
        console.log(PROJECT_ROOT+zipFile.path+'extract')


    }
    else{
        res.sendStatus(400)
    }
    //TODO: store ephemeris and observation files for session in GridFS
    //TODO: delete ephm and obs after stored in GridFS
    //TODO: verify data time ranges match ephemeris and obs file time ranges
    //TODO: validate what can be done with data here
    //TODO: create session and create process options for session
    //TODO: may have more than one sensor file per instance
    //TODO: delete temp CSV
    //TODO: if everything checks out, create a session and respond with 200 and redirect to session page

})

module.exports = router
