angular.module('app', [
    'ngRoute',
    'toaster',
    'ngAnimate'
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
        controller: 'TemplateCtrl',
        templateUrl: 'Template.html'
    })
    $routeProvider.when('/projects/:id/object-templates/:templateId', {
        controller: 'TemplateCtrl',
        templateUrl: 'Template.html'
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

angular.module('app').service('InstancesSvc', function($http) {
    this.fetch = function(projectId) {
        return dummyData
    }
})

angular.module('app').service('TemplatesSvc', function($http) {
    this.addTemplate = function(id, name, fields) {
        return $http.post('/api/projects/' + id + '/templates', {
            name: name,
            fields: fields
        })
    }
    this.editTemplate = function(projectId, templateId, name, fields) {
        return $http.put('/api/projects/' + projectId + '/templates/' + templateId, {
            name: name,
            fields: fields
        })
    }
    this.getTemplate = function(projectId, templateId) {
        return $http.get('/api/projects/' + projectId + '/templates/' + templateId)
    }
})


//CONTROLLERS
angular.module('app').controller('LoggedInHomeCtrl', function($scope, ProjectsSvc, toaster) {
    ProjectsSvc.fetch().then(function(res) {
        $scope.projects = res.data
    }).catch(function(res) {
        toaster.pop({
            type: 'error',
            title: "Error",
            body: "There is a server problem, couldn't load your projects",
            showCloseButton: true,
            timeout: 3000
        });

    })
})

angular.module('app').controller('ProjectPageCtrl', function($scope, $routeParams, $location, ProjectsSvc, InstancesSvc, toaster) {
    ProjectsSvc.fetchOne($routeParams.id).then(function(res) {
        $scope.project = res.data
        $scope.templates = $scope.project.templates
        $scope.hasTemplates = $scope.templates.length
    }).catch(function(res) {
        toaster.pop({
            type: 'error',
            title: "Error",
            body: "There is a server problem, all project information could not be loaded",
            showCloseButton: true,
            timeout: 3000
        });
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
            toaster.pop({
                type: 'success',
                title: "Project Deleted",
                showCloseButton: true,
                timeout: 3000
            });
        }).catch(function(res) {
            toaster.pop({
                type: 'error',
                title: "Error",
                body: "Couldn't delete project, project not found",
                showCloseButton: true,
                timeout: 3000
            });
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

angular.module('app').controller('NewProjectCtrl', function($scope, $location, ProjectsSvc, toaster) {
    $scope.addProject = function() {
        ProjectsSvc.send($scope.projectName, $scope.projectDescription).then(function(res) {
            $location.path('/projects/' + res.data._id);
            toaster.pop({
                type: 'success',
                title: "Project Created",
                body: "Project " + $scope.projectName + " created",
                showCloseButton: true,
                timeout: 3000
            });
        }).catch(function(res) {
            toaster.pop({
                type: 'error',
                title: "Error",
                body: "There is a server problem, your project could not be created",
                showCloseButton: true,
                timeout: 3000
            });
        })
    }
})

angular.module('app').controller('TemplateCtrl', function($scope, $routeParams, $location, TemplatesSvc, toaster) {
    $scope.editPage = $routeParams.templateId ? true : false
    $scope.fieldTypes = ["string", "number", "date/time"]
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
            type: "string"
        })
    }
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

    if ($routeParams.templateId) {
        TemplatesSvc.getTemplate($routeParams.id, $routeParams.templateId).then(function(template) {
            $scope.fields = template.data.fields
            $scope.templateName = template.data.name
            console.log($scope.fields)
        })
    } else {
        $scope.fields = [{
            name: "",
            type: "string"
        }]
        $scope.templateName = ""
    }

    $scope.submitTemplate = function() {
        if ($routeParams.templateId) {
            var templateAction = TemplatesSvc.editTemplate($routeParams.id, $routeParams.templateId, $scope.templateName, $scope.fields)
        } else {
            var templateAction = TemplatesSvc.addTemplate($routeParams.id, $scope.templateName, $scope.fields)
        }
        templateAction.then(function(res) {
            $location.path('/projects/' + $routeParams.id);
            toaster.pop({
                type: 'success',
                title: "Template Saved",
                showCloseButton: true,
                timeout: 3000
            });
        }).catch(function(res) {
            toaster.pop({
                type: 'error',
                title: "Template Error",
                body: "You must give your template and all fields a name",
                showCloseButton: true,
                timeout: 3000
            });
        })

    }
})
