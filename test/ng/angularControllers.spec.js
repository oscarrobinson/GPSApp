describe('loggedInHome.ctrl', function() {
    beforeEach(module('app'))
    var $scope
    var mockProjectsSvc = {}

    beforeEach(inject(function($q) {
        mockProjectsSvc.fetch = function() {
            var deferred = $q.defer()
            deferred.resolve({
                data: [{
                    name: "proj1",
                    description: "proj1desc"
                }, {
                    name: "proj2",
                    description: "proj2desc"

                }]
            })
            return deferred.promise
        }
    }))

    beforeEach(inject(function($rootScope, $controller) {
        $scope = $rootScope.$new()
        $controller('LoggedInHomeCtrl', {
            $scope: $scope,
            ProjectsSvc: mockProjectsSvc
        })
    }))

    it('has projects', function() {
        $scope.$digest()
        expect($scope.projects).to.have.length(2)
    })
})
