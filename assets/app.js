var app = angular.module('app', [])

app.controller('ProjectsCtrl', function($scope, $http) {
    $http.get('/api/projects')
        .success(function(projects) {
            $scope.projects = projects
        })
})
