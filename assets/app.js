angular.module('app', [
    'ngRoute'
])


//ROUTES
angular.module('app').config(function($routeProvider) {
    $routeProvider.when('/', {
        controller: 'LoggedInHomeCtrl',
        templateUrl: 'LoggedInHome.html'
    })
    $routeProvider.when('/newproject', {
        controller: 'NewProjectCtrl',
        templateUrl: 'NewProject.html'
    })
    $routeProvider.when('/projects/:id', {
        controller: 'ProjectPageCtrl',
        templateUrl: 'Project.html'
    })
})

//SERVICES
angular.module('app').service('ProjectsSvc', function($http) {
    this.fetch = function() {
        return $http.get('/api/projects')
    }
    this.fetchOne = function(id) {
        return $http.get('/api/projects/' + id)
    }
    this.send = function(name, description) {
        return $http.post('/api/projects', {
            name: name,
            description: description
        })
    }
    this.delete = function(id) {
        return $http.delete('/api/projects/' + id)
    }
})


//CONTROLLERS
angular.module('app').controller('LoggedInHomeCtrl', function($scope, ProjectsSvc) {
    ProjectsSvc.fetch().success(function(projects) {
        $scope.projects = projects
    })
})

angular.module('app').controller('ProjectPageCtrl', function($scope, $routeParams, $location, ProjectsSvc) {
    ProjectsSvc.fetchOne($routeParams.id).success(function(project) {
        $scope.project = project[0]
    })
    $scope.deleteProject = function() {
        ProjectsSvc.delete($routeParams.id).success(function() {
            $location.path('/');
        })
    }
})

angular.module('app').controller('NewProjectCtrl', function($scope, $location, ProjectsSvc) {
    $scope.addProject = function() {
        ProjectsSvc.send($scope.projectName, $scope.projectDescription).success(function(newProject) {
            $location.path('/projects/' + newProject._id);
        })
    }
})
