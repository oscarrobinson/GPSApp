angular.module('app', [
    'ngRoute',
    'toaster',
    'ngAnimate',
    'ngFileUpload'
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
    $routeProvider.when('/projects/:id/create-instance', {
        controller: 'InstanceCtrl',
        templateUrl: 'Instance.html'
    })
    $routeProvider.when('/projects/:id/object-instances/:instanceId', {
        controller: 'InstanceCtrl',
        templateUrl: 'Instance.html'
    })
    $routeProvider.when('/projects/:id/create-session', {
        controller: 'SessionCreateCtrl',
        templateUrl: 'CreateSession.html'
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
    this.getInstance = function(id, instanceId) {
        return $http.get('/api/projects/' + id + '/instances/' + instanceId)
    }
    this.addInstance = function(id, type, fields) {
        return $http.post('/api/projects/' + id + '/instances', {
            type: type,
            fields: fields
        })
    }
    this.updateInstance = function(id, instanceId, fields) {
        return $http.put('/api/projects/' + id + '/instances/' + instanceId, {
            fields: fields
        })
    }
    this.getCSV = function(id, isUpload) {
        if (isUpload) {
            return $http.get('/api/projects/' + id + '/instances/csv-upload')
        } else {
            return $http.get('/api/projects/' + id + '/instances/csv')
        }
    }
    this.delete = function(id, instanceId) {
        return $http.delete('/api/projects/' + id + '/instances/' + instanceId)
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
    this.getTemplates = function(projectId) {
        return $http.get('/api/projects/' + projectId + '/templates')
    }
     this.delete = function(id, templateId) {
        return $http.delete('/api/projects/' + id + '/templates/' + templateId)
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
        $scope.instances = $scope.project.instances
        $scope.sessions = []
        $scope.hasTemplates = $scope.templates.length
        $scope.hasInstances = $scope.instances.length
    }).catch(function(res) {
        toaster.pop({
            type: 'error',
            title: "Error",
            body: "There is a server problem, all project information could not be loaded",
            showCloseButton: true,
            timeout: 3000
        });
    })

    //filters
    $scope.instanceSearch = ""
    $scope.templateSearch = ""
    $scope.sessionSearch = ""

    $scope.downloadCSV = function(arg) {
        if (arg === "upload") {
            //we need to return the CSV for uploading a session
            InstancesSvc.getCSV($routeParams.id, true).then(function(res) {
                var hiddenElement = document.createElement('a');
                hiddenElement.href = 'data:attachment/csv,' + encodeURI(res.data);
                hiddenElement.target = '_blank';
                hiddenElement.download = $scope.project.name + '-sessionSensorMap.csv';
                hiddenElement.click();
            })

        } else {
            //CSV with all instance data
            InstancesSvc.getCSV($routeParams.id, false).then(function(res) {
                var hiddenElement = document.createElement('a');
                hiddenElement.href = 'data:attachment/csv,' + encodeURI(res.data);
                hiddenElement.target = '_blank';
                hiddenElement.download = $scope.project.name + '-allData.csv';
                hiddenElement.click();
            })
        }
    }

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
        lookup: "time",
        description: "Time"
    }, {
        lookup: "date",
        description: "Date"
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
    $scope.cancel = function() {
        $location.path('/projects/' + $routeParams.id);
    }

    $scope.delete = function(){
        TemplatesSvc.delete($routeParams.id, $routeParams.templateId).then(function(res) {
            $location.path('/projects/' + $routeParams.id)
            toaster.pop({
                type: 'success',
                title: "Template Deleted",
                showCloseButton: true,
                timeout: 3000
            });
        }).catch(function(res) {
            toaster.pop({
                type: 'error',
                title: "Error",
                body: res.data,
                showCloseButton: true,
                timeout: 3000
            });
        })
    }
})

angular.module('app').controller('InstanceCtrl', function($scope, $routeParams, $location, InstancesSvc, TemplatesSvc, toaster) {
    $scope.editPage = $routeParams.instanceId ? true : false
    $scope.createPage = !$scope.editPage
    $scope.fieldsWithValues = []
    $scope.fields = []
    $scope.templateName = ""
    TemplatesSvc.getTemplates($routeParams.id).then(function(templates) {
        $scope.templates = templates.data
        if ($scope.editPage) {
            InstancesSvc.getInstance($routeParams.id, $routeParams.instanceId).then(function(instance) {
                for (var i = 0; i < $scope.templates.length; i++) {
                    if ($scope.templates[i].name === instance.data.type) {
                        $scope.template = $scope.templates[i]
                        break
                    }
                }
                $scope.templateName = instance.data.type
                for (var i = 0; i < $scope.template.fields.length; i++) {
                    var field = $scope.template.fields[i]
                    var actualField = {}
                    actualField["field"] = field.name
                    actualField["value"] = JSON.parse(instance.data.fields)[field.name.replace(/ /g, "_")]
                    if (field.type === "time" || field.type == "date") {
                        actualField["original"] = actualField["value"]

                    }
                    $scope.fieldsWithValues.push(actualField)
                    $scope.fields.push(field)

                }
            })
        }
    })

    $scope.changeTemplate = function(template) {
        $scope.fields = template.fields
        $scope.templateName = template.name
        for (var i = 0; i < $scope.fields.length; i++) {
            var field = $scope.fields[i]
            var actualField = {}
            actualField["field"] = field.name
            actualField["value"] = ""
            $scope.fieldsWithValues.push(actualField)
        }
    }

    $scope.delete = function() {
        InstancesSvc.delete($routeParams.id, $routeParams.instanceId).then(function(res) {
            $location.path('/projects/' + $routeParams.id)
            toaster.pop({
                type: 'success',
                title: "Instance Deleted",
                showCloseButton: true,
                timeout: 3000
            });
        }).catch(function(res) {
            toaster.pop({
                type: 'error',
                title: "Error",
                body: "Couldn't delete instance, instance not found",
                showCloseButton: true,
                timeout: 3000
            });
        })
    }

    $scope.fieldValueChange = function(index) {
        //nothing to do
    }
    $scope.submitInstance = function() {
        var fields = {}
        for (var i = 0; i < $scope.fieldsWithValues.length; i++) {
            fields[$scope.fieldsWithValues[i].field.replace(/ /g, "_")] = $scope.fieldsWithValues[i].value
        }
        if ($scope.editPage) {
            InstancesSvc.updateInstance($routeParams.id, $routeParams.instanceId, fields).then(function(res) {
                $location.path('/projects/' + $routeParams.id);
                toaster.pop({
                    type: 'success',
                    title: "Instance Changes Saved",
                    showCloseButton: true,
                    timeout: 3000
                });
            })
        } else {
            InstancesSvc.addInstance($routeParams.id, $scope.templateName, fields).then(function(res) {
                $location.path('/projects/' + $routeParams.id);
                toaster.pop({
                    type: 'success',
                    title: "Instance Saved",
                    showCloseButton: true,
                    timeout: 3000
                });
            }).catch(function(res) {
                toaster.pop({
                    type: 'error',
                    title: "Instance Error",
                    body: "There was a problem with the values in your instance",
                    showCloseButton: true,
                    timeout: 3000
                });
            })
        }
    }
    $scope.cancel = function() {
        $location.path('/projects/' + $routeParams.id);
    }
})

angular.module('app').controller('SessionCreateCtrl', function($scope, $routeParams, $location, Upload, toaster, $timeout) {
    function fileError(title, msg, errorVal) {
        toaster.pop({
            type: 'error',
            title: title,
            body: msg,
            showCloseButton: true,
            timeout: 5000
        });
        $scope[errorVal]++
            $timeout(function() {
                $scope[errorVal]--
            }, 5000)
    }

    $scope.zipError = 0
    $scope.csvError = 0
    $scope.obsError = 0
    $scope.ephemError = 0

    $scope.submit = function() {
        var noErrors = true
        if (!$scope.zipFile) {
            fileError("Zip File Missing", "You must add a zip file containing your data", "zipError")
            noErrors = false
        }
        if (!$scope.csvFile) {
            fileError("CSV File Missing", "You must add a CSV file matching data files to instance IDs", "csvError")
            noErrors = false
        }
        if (!$scope.obsFile) {
            fileError("Obs File Missing", "You must add a base station observation file for your GPS readings", "obsError")
            noErrors = false
        }
        if (!$scope.ephemFile) {
            fileError("Ephemeris File Missing", "You must add a satellite Ephemeris file for your GPS data", "ephemError")
            noErrors = false
        }

        if (noErrors) {
            Upload.upload({
                url: '/api/projects/' + $routeParams.id + '/sessions',
                arrayKey: '',
                data: {
                    files: [$scope.zipFile, $scope.csvFile, $scope.obsFile, $scope.ephemFile]
                },
            });
        }
    }
})


//DIRECTIVES
angular.module('app').directive('timepicker', function() {
    return function($scope, $element, attrs) {
        $element.timepicker();
    }
});
angular.module('app').directive('datepicker', function() {
    return function($scope, $element, attrs) {
        $element.datepicker({
            format: 'dd/mm/yyyy',

        });
    }
});
