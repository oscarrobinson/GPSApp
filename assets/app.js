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
    $routeProvider.when('/projects/:id/create-template', {
        controller: 'NewTemplateCtrl',
        templateUrl: 'CreateTemplate.html'
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
    this.addTemplate = function(id, name, fields) {
        return $http.post('/api/projects/' + id + '/templates', {
            name: name,
            fields: fields
        })
    }
})

angular.module('app').service('InstancesSvc', function($http) {
    this.fetch = function(projectId) {
        return dummyData
    }
})


//CONTROLLERS
angular.module('app').controller('LoggedInHomeCtrl', function($scope, ProjectsSvc) {
    ProjectsSvc.fetch().then(function(res) {
        console.log(res.data)
        $scope.projects = res.data
    }).catch(function(res) {
        console.log("ERROR")
    })
})

angular.module('app').controller('ProjectPageCtrl', function($scope, $routeParams, $location, ProjectsSvc, InstancesSvc) {
    ProjectsSvc.fetchOne($routeParams.id).then(function(res) {
        $scope.project = res.data
        $scope.templates = $scope.project.templates
        $scope.hasTemplates = $scope.templates.length
    }).catch(function(res) {
        console.log("ERROR")
    })
    $scope.instances = [{
        easyId: 2314,
        _id: "897fe8768632487324fe",
        name: "Oscar",
        age: "8",
        health: "Healthy"
    }, {
        easyId: 2214,
        _id: "897fe8768632487324fe",
        name: "Steve",
        age: "10",
        health: "Healthy"
    }, {
        easyId: 2314,
        _id: "897fe8768632487324fe",
        name: "Oscar",
        age: "8",
        health: "Healthy"
    }, ]
    $scope.sessions = [{
            _id: "897fe8768632487324fe",
            startTime: "12/12/12 23:31"
        }, {
            _id: "897fe8768632487324fe",
            startTime: "10/11/15 19:52"
        }, {
            _id: "897fe8768632487324fe",
            startTime: "12/12/12 23:31"
        }, {
            _id: "897fe8768632487324fe",
            startTime: "10/11/15 19:52"
        }, {
            _id: "897fe8768632487324fe",
            startTime: "12/12/12 23:31"
        }, {
            _id: "897fe8768632487324fe",
            startTime: "10/11/15 19:52"
        }, {
            _id: "897fe8768632487324fe",
            startTime: "12/12/12 23:31"
        }, {
            _id: "897fe8768632487324fe",
            startTime: "10/11/15 19:52"
        }, {
            _id: "897fe8768632487324fe",
            startTime: "12/12/12 23:31"
        }, {
            _id: "897fe8768632487324fe",
            startTime: "10/11/15 19:52"
        }, {
            _id: "897fe8768632487324fe",
            startTime: "12/12/12 23:31"
        }, ]
        //filters
    $scope.instanceSearch = ""
    $scope.templateSearch = ""
    $scope.sessionSearch = ""
    $scope.deleteProject = function() {
        ProjectsSvc.delete($routeParams.id).then(function() {
            $location.path('/');
        }).catch(function(res) {
            console.log("ERROR")
        })
    }
    $scope.createInstance = function() {
        var currentPath = $location.path()
        $location.path(currentPath + "/create-instance");
    }
    $scope.createTemplate = function() {
        var currentPath = $location.path()
        $location.path(currentPath + "/create-template");
    }
    $scope.createSession = function() {
        var currentPath = $location.path()
        $location.path(currentPath + "/create-session");
    }
})

angular.module('app').controller('NewProjectCtrl', function($scope, $location, ProjectsSvc) {
    $scope.addProject = function() {
        ProjectsSvc.send($scope.projectName, $scope.projectDescription).then(function(res) {
            $location.path('/projects/' + res.data._id);
        }).catch(function(res) {
            console.log("ERROR")
        })
    }
})

angular.module('app').controller('NewTemplateCtrl', function($scope, $routeParams, $location, ProjectsSvc) {
    $scope.fieldTypes = ["string", "number", "date/time"]
    $scope.fields = [{
        name: "",
        type: "String"
    }]
    $scope.fieldTypeSelectorState = [{
        lookup: "string",
        description: "String"
    }, {
        lookup: "number",
        description: "Number"
    }, {
        lookup: "date/time",
        description: "Date/Time"
    }]
    $scope.addField = function() {
        $scope.fields.push({
            name: "",
            type: "String"
        })
    }
    $scope.templateName = ""
    $scope.updateName = function(name) {
        $scope.templateName = name
    }
    $scope.removeField = function(index) {
        $scope.fields.splice(index, 1)
    }

    $scope.changeFieldType = function(index, fieldTypeSelected) {
        $scope.fields[index].type = fieldTypeSelected;
    }
    $scope.fieldTypeNameChange = function(index, fieldName) {
        $scope.fields[index].name = fieldName;
    }
    $scope.createTemplate = function() {
        ProjectsSvc.addTemplate($routeParams.id, $scope.templateName, $scope.fields)
        $location.path('/projects/' + $routeParams.id)
    }
})
