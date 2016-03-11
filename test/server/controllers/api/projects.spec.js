var api = require('../../support/api')
var expect = require('chai').expect
var Project = require('../../../../models/project')
var User = require('../../../../models/user')


var projectId = ""
var tokenA = ""
var tokenB = ""

//Test post and assert exists after post
describe('Project Tests', function() {

    before(function(done) {
        api.post('/api/users').send({
            username: 'test',
            email: 'myemail@addr.com',
            password: 'myPass'
        }).end(function(err, res) {
            api.post('/api/login').send({
                email: 'myemail@addr.com',
                password: 'myPass'
            }).end(function(err, res) {
                tokenA = res.body
                api.post('/api/users').send({
                    username: 'test2',
                    email: 'myemail2@addr.com',
                    password: 'myPass'
                }).end(function(err, res) {
                    api.post('/api/login').send({
                        email: 'myemail2@addr.com',
                        password: 'myPass'
                    }).end(function(err, res) {
                        tokenB = res.body
                        done()
                    })
                })
            })
        })


    })

    after(function() {
        User.remove({
            username: 'test'
        }, function() {})
    })

    it('Add project', function(done) {
        api.post('/api/projects')
            .send({
                name: "Test Project",
                description: "a test project description"
            })
            .set('X-Auth', tokenA)
            .expect(201)
            .end(function(err, res) {
                projectId = res.body._id
                Project.findOne({
                    _id: projectId
                }, function(err, project) {
                    expect(project.name).to.equal('Test Project')
                    done(err)
                })
            })

    })

    it('Cant get projects dont own', function(done) {
        api.get('/api/projects')
            .set('X-Auth', tokenB)
            .expect(200)
            .expect(function(res) {
                expect(res.body.length).to.equal(0)
            })
            .end(function(err, res) {
                done(err)
            })
    })



    it('Get project by id', function(done) {
        api.get('/api/projects/' + projectId)
            .set('X-Auth', tokenA)
            .expect(200)
            .expect(function(res) {
                expect(res.body.name).to.equal('Test Project')
            })
            .end(function(err, res) {
                done(err)
            })
    })

    it('Fail to get individual project dont own', function(done) {
        api.get('/api/projects/' + projectId)
            .set('X-Auth', tokenB)
            .expect(401)
            .end(function(err, res) {
                done(err)
            })
    })

    var templateId;
    it('Add template to project', function(done) {
        api.post('/api/projects/' + projectId + '/templates')
            .send({
                name: "childWrong",
                fields: [{
                    name: "age",
                    type: "int"
                }]
            })
            .set('X-Auth', tokenA)
            .expect(201)
            .end(function(err, res) {
                templateId = res.body.templates[0]._id
                Project.findById(projectId, function(err, project) {
                    expect(project.templates.length).to.equal(1)
                    done(err)
                })
            })

    })

    it('Fail to get template from project dont own', function(done) {
        api.get('/api/projects/' + projectId + '/templates/' + templateId)
            .set('X-Auth', tokenB)
            .expect(401)
            .end(function(err, res) {
                expect(res.body).to.be.empty
                done(err)
            })
    })

    it('Fail to get templates from project dont own', function(done) {
        api.get('/api/projects/' + projectId + '/templates')
            .set('X-Auth', tokenB)
            .expect(401)
            .end(function(err, res) {
                expect(res.body).to.be.empty
                done(err)
            })
    })

    it('Cant add template to project dont own', function(done) {
        api.post('/api/projects/' + projectId + '/templates')
            .send({
                name: "childWrong",
                fields: [{
                    name: "age",
                    type: "int"
                }]
            })
            .set('X-Auth', tokenB)
            .expect(401)
            .end(function(err, res) {
                Project.findById(projectId, function(err, project) {
                    expect(project.templates.length).to.equal(1)
                    done(err)
                })
            })

    })

    it('Cant edit template dont own', function(done) {
        api.put('/api/projects/' + projectId + '/templates/' + templateId)
            .send({
                name: "child",
                fields: [{
                    name: "age",
                    type: "number"
                }]
            })
            .set('X-Auth', tokenB)
            .expect(401)
            .end(function(err, res) {
                Project.findById(projectId, function(err, project) {
                    expect(project.templates.id(templateId).name).to.equal("childWrong")
                    done(err)
                })
            })
    })

    it('Edit the template', function(done) {
        api.put('/api/projects/' + projectId + '/templates/' + templateId)
            .send({
                name: "child",
                fields: [{
                    name: "age",
                    type: "number"
                }]
            })
            .set('X-Auth', tokenA)
            .expect(201)
            .end(function(err, res) {
                Project.findById(projectId, function(err, project) {
                    expect(project.templates.id(templateId).name).to.equal("child")
                    done(err)
                })
            })
    })


    it('Cant delete template for project dont own', function(done) {
        api.delete('/api/projects/' + projectId + '/templates/' + templateId)
            .set('X-Auth', tokenB)
            .expect(401)
            .end(function(err, res) {
                done(err)
            })
    })


    it('Add a couple of instances', function(done) {
        api.post('/api/projects/' + projectId + '/instances')
            .send({
                type: "child",
                fields: {
                    age: 12
                }
            })
            .set('X-Auth', tokenA)
            .expect(201)
            .end(function(err, res) {
                instanceId = res.body.instances[0]._id
                Project.findById(projectId, function(err, project) {
                    expect(project.instances.id(instanceId).type).to.equal("child")
                    expect(project.instances.id(instanceId).id).to.equal(1)
                    done(err)
                })
            })
        api.post('/api/projects/' + projectId + '/instances')
            .send({
                type: "child",
                fields: {
                    age: 14
                }
            })
            .set('X-Auth', tokenA)
            .expect(201)
            .end(function(err, res) {
                instanceId = res.body.instances[0]._id
                Project.findById(projectId, function(err, project) {
                    expect(project.instances.id(instanceId).type).to.equal("child")
                    expect(project.instances.id(instanceId).id).to.equal(2)
                    done(err)
                })
            })
    })

    it('Cant add instance to project dont own', function(done) {
        api.post('/api/projects/' + projectId + '/instances')
            .send({
                type: "child",
                fields: {
                    age: 32424
                }
            })
            .set('X-Auth', tokenB)
            .expect(401)
            .end(function(err, res) {
                Project.findById(projectId, function(err, project) {
                    expect(project.instances.length).to.equal(2)
                    done(err)
                })
            })
    })

    it('Edit instance', function(done) {
        api.put('/api/projects/' + projectId + '/instances/' + instanceId)
            .send({
                fields: {
                    age: 211
                }
            })
            .set('X-Auth', tokenA)
            .expect(200)
            .end(function(err, res) {
                Project.findById(projectId, function(err, project) {
                    expect(project.instances.id(instanceId).fields['age']).to.equal(211)
                    done(err)
                })
            })
    })

    it('Cant edit instance in project dont own', function(done) {
        api.put('/api/projects/' + projectId + '/instances/' + instanceId)
            .send({
                fields: {
                    age: 32424
                }
            })
            .set('X-Auth', tokenB)
            .expect(401)
            .end(function(err, res) {
                Project.findById(projectId, function(err, project) {
                    expect(project.instances.id(instanceId).fields['age']).to.equal(211)
                    done(err)
                })
            })
    })

    it('Add instance with incorrect template fields', function(done) {
        api.post('/api/projects/' + projectId + '/instances')
            .send({
                type: "child",
                fields: {
                    agesdf: 12
                }
            })
            .set('X-Auth', tokenA)
            .end(function(err, res) {
                expect(res.statusCode).to.equal(400)
                done(err)
            })
    })

    it('Cant delete project dont own', function(done) {
        api.delete('/api/projects/' + projectId)
            .set('X-Auth', tokenB)
            .expect(401)
            .end(function(err) {
                Project.findOne({
                    _id: projectId
                }, function(err, project) {
                    expect(project.name).to.equal('Test Project')
                    done(err)
                })
            })

    })

    it('Delete a project', function(done) {
        api.delete('/api/projects/' + projectId)
            .set('X-Auth', tokenA)
            .expect(201)
            .end(function(err) {
                Project.findOne({
                    _id: projectId
                }, function(err, project) {
                    expect(project).to.equal(null)
                    done(err)
                })
            })

    })

    it('Error if no project with id found to delete', function(done) {
        api.delete('/api/projects/notacorrectid')
            .set('X-Auth', tokenA)
            .expect(404)
            .end(function(err, res) {
                expect(res.error.text).to.equal('Project Not Found')
                done(err)
            })

    })
})
