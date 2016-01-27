var gulp = require('gulp')
var concat = require('gulp-concat')
var nodemon = require('gulp-nodemon')

//master task, runs watch:js daemon and runs server
//gulp-nodemon restarts server on js change
gulp.task('dev', ['dev:server'])

gulp.task('dev:server', function() {
    nodemon({
        script: 'server.js',
        ext: 'js',
        ignore: ['ng*', 'assets*']
    })
})
