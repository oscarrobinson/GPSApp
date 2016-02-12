var api = require('../../support/api')
var expect = require('chai').expect
var Project = require('../../../../models/project')


var projectId = ""

//Test post and assert exists after post
describe('Project Tests', function() {
    it('Add project', function(done) {
        api.post('/api/projects')
            .send({
                name: "Test Project",
                description: "a test project description"
            })
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
    it('Get project by id', function(done) {
        api.get('api/projects/' + projectId)
            .expect(200)
            .expect(function(res) {
                expect(res.body.name).to.equal('Test Project')
            })
        done()
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
            .expect(201)
            .end(function(err, res) {
                templateId = res.body.templates[0]._id
                Project.findById(projectId, function(err, project) {
                    expect(project.templates.length).to.equal(1)
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
            .expect(201)
            .end(function(err, res) {
                Project.findById(projectId, function(err, project) {
                    expect(project.templates.id(templateId).name).to.equal("child")
                    done(err)
                })
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

    it('Add instance with incorrect template fields', function(done) {
        api.post('/api/projects/' + projectId + '/instances')
            .send({
                type: "child",
                fields: {
                    agesdf: 12
                }
            })
            .end(function(err, res) {
                expect(res.statusCode).to.equal(400)
                done(err)
            })
    })

    it('Delete a project', function(done) {
        api.delete('/api/projects/' + projectId)
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
            .expect(404)
            .end(function(err, res) {
                expect(res.error.text).to.equal('Project Not Found')
                done(err)
            })

    })
})
