var router = require('express').Router()
var jwt = require('jwt-simple')
var bcrypt = require('bcrypt')
var User = require('../../models/user')
var config = require('../../config')

var HASH_PASSES = 10

function getHash(pw) {
    var hash = bcrypt.hashSync(pw, 10)
    return hash
}


//create user
router.post('/api/users', function(req, res, next) {
    var email = req.body.email
    var username = req.body.username
    var errmsg = ""

    User.find({
        username: username
    }, function(err, docs) {
        if (docs.length) {
            errmsg = "An account with that name already exists"
        }
        User.find({
            email: email
        }, function(err, docs) {
            if (docs.length) {
                errmsg = "An account with that email address already exists"
            }

            if (!errmsg) {
                bcrypt.hash(req.body.password, HASH_PASSES, function(err, password) {
                    var user = new User({
                        email: email,
                        username: username,
                        password: password
                    })
                    user.save(function(err, user) {
                        if (err) {
                            return next(err)
                        }
                        res.status(201).json(user)
                    })
                })
            } else {
                res.status(400).send(errmsg)
            }
        })
    })
})

//get token
router.post('/api/login', function(req, res, next) {
    User.findOne({
        email: req.body.email
    }, function(err, user) {
        if (err) {
            return res.send(401)
        }
        if (!user) {
            return res.send(401)
        }
        bcrypt.compare(req.body.password, user.password, function(err, valid) {
            if (err) {
                return next(err)
            }
            if (!valid) {
                return res.send(401)
            }
            var token = jwt.encode({
                username: user.username,
                email: user.email,
                id: user._id
            }, config.jwt_secret)
            res.json(token)
        })
    })
})

//get user
router.get('/api/users', function(req, res) {
    if (!req.headers['x-auth']) {
        return res.send(401)
    }
    var token = req.headers['x-auth']
    var auth = jwt.decode(token, config.jwt_secret)
    User.findOne({
        username: auth.username
    }, function(err, user) {
        if (err) {
            return next(err)
        }
        res.json(user)
    })
})



//get user - checks for x-auth, if have return data about yourself, if not return 401

module.exports = router
