var api = require('../../support/api')
var expect = require('chai').expect
var User = require('../../../../models/user')

describe('Auth Tests', function() {
    it('Add user', function(done) {
        api.post('/api/users').send({
            username: 'test',
            email: 'myemail@addr.com',
            password: 'myPass'
        }).end(function(err, res) {
            expect(res.statusCode).to.equal(201)
            done(err)
        })
    })
    it('Fail to add user with same email', function(done) {
        api.post('/api/users').send({
            username: 'Osc9*(Y(HUD',
            email: 'myemail@addr.com',
            password: 'myPdsfsdfass'
        }).end(function(err, res) {
            expect(res.statusCode).to.equal(400)
            User.remove({
                username: 'test'
            }, function() {
                done(err)
            })

        })
    })
})
