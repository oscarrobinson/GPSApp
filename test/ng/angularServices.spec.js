describe('projects.svc', function() {
    beforeEach(module('app'))
    var ProjectsSvc

    beforeEach(inject(function(_ProjectsSvc_, _$httpBackend_) {
        ProjectsSvc = _ProjectsSvc_
        $httpBackend = _$httpBackend_
    }))

    afterEach(function() {
        $httpBackend.flush()
    })

    describe('#deletes', function() {

        beforeEach(function() {
            //stub the serverside stuff
            $httpBackend.expect('DELETE', '/api/projects/anId')
                .respond(201)
        })
        it('deletes a project', function() {
            ProjectsSvc.delete("anId")
        })
    })
})
