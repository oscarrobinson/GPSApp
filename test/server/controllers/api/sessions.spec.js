var api = require('../../support/api')
var expect = require('chai').expect
var Project = require('../../../../models/project')
var User = require('../../../../models/user')
var Session = require('../../../../models/session')


var projectId = ""
var tokenA = ""
var tokenB = ""

//Test post and assert exists after post
describe('Session Tests', function() {

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
                done(err)
            })
        })
    })

    after(function() {
        User.remove({
            username: 'test'
        }, function() {})
    })

    var projectId
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



    var templateId;
    it('Add template to project', function(done) {
        api.post('/api/projects/' + projectId + '/templates')
            .send({
                name: "child",
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


    var instanceId
    it('Add three instances', function(done) {
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
                            instanceId = res.body.instances[1]._id
                            Project.findById(projectId, function(err, project) {
                                expect(project.instances.id(instanceId).type).to.equal("child")
                                expect(project.instances.id(instanceId).id).to.equal(2)
                                api.post('/api/projects/' + projectId + '/instances')
                                    .send({
                                        type: "child",
                                        fields: {
                                            age: 15
                                        }
                                    })
                                    .set('X-Auth', tokenA)
                                    .expect(201)
                                    .end(function(err, res) {
                                        instanceId = res.body.instances[2]._id
                                        Project.findById(projectId, function(err, project) {
                                            expect(project.instances.id(instanceId).type).to.equal("child")
                                            expect(project.instances.id(instanceId).id).to.equal(3)
                                            done(err)
                                        })
                                    })
                            })
                        })
                })
            })


    })

    var sessionId

    it('Add a session', function(done) {
        api.post('/api/projects/' + projectId + '/sessions')
            .set('X-Auth', tokenA)
            .attach('files', './test/files/d.zip')
            .attach('files', './test/files/m.csv')
            .attach('files', './test/files/o.15o.txt')
            .attach('files', './test/files/e.n')
            .end(function(err, res) {
                sessionId = res.body._id
                expect(res.status).to.equal(201)
                done(err)
            })
    })

    it('Error when no zip', function(done) {
        api.post('/api/projects/' + projectId + '/sessions')
            .set('X-Auth', tokenA)
            .attach('files', './test/files/m.csv')
            .attach('files', './test/files/o.15o.txt')
            .attach('files', './test/files/e.n')
            .end(function(err, res) {
                expect(res.status).to.equal(400)
                done(err)
            })
    })

    it('Error when no csv', function(done) {
        api.post('/api/projects/' + projectId + '/sessions')
            .set('X-Auth', tokenA)
            .attach('files', './test/files/d.zip')
            .attach('files', './test/files/o.15o.txt')
            .attach('files', './test/files/e.n')
            .end(function(err, res) {
                expect(res.status).to.equal(400)
                done(err)
            })
    })

    it('Error when no obs', function(done) {
        api.post('/api/projects/' + projectId + '/sessions')
            .set('X-Auth', tokenA)
            .attach('files', './test/files/d.zip')
            .attach('files', './test/files/m.csv')
            .attach('files', './test/files/e.n')
            .end(function(err, res) {
                expect(res.status).to.equal(400)
                done(err)
            })
    })

    it('Error when no ephemeris', function(done) {
        api.post('/api/projects/' + projectId + '/sessions')
            .set('X-Auth', tokenA)
            .attach('files', './test/files/d.zip')
            .attach('files', './test/files/m.csv')
            .attach('files', './test/files/o.15o.txt')
            .end(function(err, res) {
                expect(res.status).to.equal(400)
                done(err)
            })
    })

    it('Error when instances in CSV wrong', function(done) {
        api.post('/api/projects/' + projectId + '/sessions')
            .set('X-Auth', tokenA)
            .attach('files', './test/files/d.zip')
            .attach('files', './test/files/m-wrong-instances.csv')
            .attach('files', './test/files/o.15o.txt')
            .attach('files', './test/files/e.n')
            .end(function(err, res) {
                expect(res.status).to.equal(400)
                done(err)
            })
    })


    it('Error when file names in CSV wrong', function(done) {
        api.post('/api/projects/' + projectId + '/sessions')
            .set('X-Auth', tokenA)
            .attach('files', './test/files/d.zip')
            .attach('files', './test/files/m-wrong-files.csv')
            .attach('files', './test/files/o.15o.txt')
            .attach('files', './test/files/e.n')
            .end(function(err, res) {
                expect(res.status).to.equal(400)
                done(err)
            })
    })

    it('Error when no parser for a file', function(done) {
        api.post('/api/projects/' + projectId + '/sessions')
            .set('X-Auth', tokenA)
            .attach('files', './test/files/d-file-badtype.zip')
            .attach('files', './test/files/m.csv')
            .attach('files', './test/files/o.15o.txt')
            .attach('files', './test/files/e.n')
            .end(function(err, res) {
                expect(res.status).to.equal(400)
                done(err)
            })
    })

    it('Error when unparseable file', function(done) {
        api.post('/api/projects/' + projectId + '/sessions')
            .set('X-Auth', tokenA)
            .attach('files', './test/files/d-corrupt.zip')
            .attach('files', './test/files/m.csv')
            .attach('files', './test/files/o.15o.txt')
            .attach('files', './test/files/e.n')
            .end(function(err, res) {
                expect(res.status).to.equal(400)
                done(err)
            })
    })

    it('Begin running process that is available', function(done) {
        api.post('/api/projects/' + projectId + '/sessions/' + sessionId + '/runprocess')
            .set('X-Auth', tokenA)
            .send({
                name: "rtk_positioning"
            })
            .end(function(err, res) {
                expect(res.status).to.equal(200)
                Session.findOne({ _id: sessionId }, function(err, session) {
                    for (var i = 0; i < session.processes.length; i++) {
                        if ("rtk_positioning" == session.processes[i].indexName) {
                            expect(session.processes[i].runState).to.equal("Running")
                        }
                    }
                    done(err)
                })
            })
    })

    it('Check process runstate periodically', function(done) {
        this.timeout(5000);
        var intervalId = setInterval(function() {
            api.get('/api/projects/' + projectId + '/sessions/' + sessionId + '/processProgress')
                .set('X-Auth', tokenA)
                .end(function(err, res) {
                    if (res.body[0].runState == "Run") {
                        expect(res.body[0].instancesProcessed).to.equal(3)
                        clearInterval(intervalId)
                        done()
                    } else {
                        expect(res.body[0].runState).to.equal("Running")
                    }
                })
        }, 200)

    })

    it('Check all process work has completed', function(done) {
        Session.findById(sessionId, function(err, session) {
            for (var k = 0; k < session.processes.length; k++) {
                if (session.processes[k].indexName == "ionospheric_correction") {
                    expect(session.processes[k].instancesProcessed).to.equal(3)
                    expect(session.processes[k].runState).to.equal("Run")
                    break
                }
            }
            done()
        })
    })

    it('Get data CSV for session', function(done) {
        this.timeout(5000);
        api.get('/api/projects/' + projectId + '/sessions/' + sessionId + '/getAllDataCsv')
            .set('X-Auth', tokenA)
            .end(function(err, res) {
                expect(res.status).to.equal(200)
                done(err)
            })
    })

    it('Delete Session', function(done) {
        api.delete('/api/projects/' + projectId + '/sessions/' + sessionId)
            .set('X-Auth', tokenA)
            .end(function(err, res) {
                expect(res.status).to.equal(200)
                done(err)
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


})