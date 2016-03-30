angular.module('app', [
    'ngRoute',
    'toaster',
    'ngAnimate',
    'ngFileUpload'
])


//ROUTES

var onlyLoggedIn = function($location, $q, $window) {
    var deferred = $q.defer();
    if ($window.localStorage.token) {
        deferred.resolve();
    } else {
        deferred.reject();
        $location.url('/login?then=' + $location.path().substring(1));
    }
    return deferred.promise;
};

angular.module('app').config(function($routeProvider) {
    $routeProvider.when('/', {
        controller: 'LoggedInHomeCtrl',
        templateUrl: 'LoggedInHome.html',
        resolve: {
            loggedIn: onlyLoggedIn
        }
    })
    $routeProvider.when('/newproject', {
        controller: 'NewProjectCtrl',
        templateUrl: 'NewProject.html',
        resolve: {
            loggedIn: onlyLoggedIn
        }
    })
    $routeProvider.when('/projects/:id', {
        controller: 'ProjectPageCtrl',
        templateUrl: 'Project.html',
        resolve: {
            loggedIn: onlyLoggedIn
        }
    })
    $routeProvider.when('/projects/:id/create-template', {
        controller: 'TemplateCtrl',
        templateUrl: 'Template.html',
        resolve: {
            loggedIn: onlyLoggedIn
        }
    })
    $routeProvider.when('/projects/:id/object-templates/:templateId', {
        controller: 'TemplateCtrl',
        templateUrl: 'Template.html',
        resolve: {
            loggedIn: onlyLoggedIn
        }
    })
    $routeProvider.when('/projects/:id/create-instance', {
        controller: 'InstanceCtrl',
        templateUrl: 'Instance.html',
        resolve: {
            loggedIn: onlyLoggedIn
        }
    })
    $routeProvider.when('/projects/:id/object-instances/:instanceId', {
        controller: 'InstanceCtrl',
        templateUrl: 'Instance.html',
        resolve: {
            loggedIn: onlyLoggedIn
        }
    })
    $routeProvider.when('/projects/:id/create-session', {
        controller: 'SessionCreateCtrl',
        templateUrl: 'CreateSession.html',
        resolve: {
            loggedIn: onlyLoggedIn
        }
    })
    $routeProvider.when('/projects/:id/sessions/:sessionId', {
        controller: 'SessionCtrl',
        templateUrl: 'Session.html',
        resolve: {
            loggedIn: onlyLoggedIn
        }
    })
    $routeProvider.when('/projects/:id/sessions/:sessionId/:processName', {
        controller: 'ProcessCtrl',
        templateUrl: 'Process.html',
        resolve: {
            loggedIn: onlyLoggedIn
        }
    })
    $routeProvider.when('/login', {
        controller: 'LoginCtrl',
        templateUrl: 'Login.html'
    })
    $routeProvider.when('/register', {
        controller: 'RegisterCtrl',
        templateUrl: 'Register.html'
    })
    $routeProvider.when('/logout', {
        controller: 'LogoutCtrl',
        templateUrl: 'Logout.html',
        resolve: {
            loggedIn: onlyLoggedIn
        }
    });
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

angular.module('app').service('SessionSvc', function($http) {
    this.getProjectSessions = function(id) {
        return $http.get('/api/projects/' + id + '/sessions')
    }

    this.getSession = function(projectId, sessionId) {
        return $http.get('/api/projects/' + projectId + "/sessions/" + sessionId)
    }
    this.getDataCsvs = function(projectId, sessionId) {
        return $http.get('/api/projects/' + projectId + '/sessions/' + sessionId + '/getAllDataCsv', {
            responseType: 'arraybuffer'
        })
    }
    this.deleteSession = function(projectId, sessionId) {
        return $http.delete('/api/projects/' + projectId + '/sessions/' + sessionId)
    }
})

angular.module('app').service('ProcessSvc', function($http) {
    this.getProcess = function(name) {
        return $http.get('/api/process/' + name)
    }
    this.startProcess = function(project, session, processName, extraData) {
        return $http.post('/api/projects/' + project + '/sessions/' + session + '/runprocess', {
            name: processName,
            extraData: extraData
        })
    }
    this.pollProcess = function(project, session) {
        return $http.get('/api/projects/' + project + '/sessions/' + session + "/processProgress")
    }
})

angular.module('app').service('UserSvc', function($http, $window) {
    var svc = this
    this.getUser = function() {
        return $http.get('/api/users')
    }

    this.login = function(email, password) {
        //after login called on service, all future requests contain the X-Auth header
        return $http.post('/api/login', {
            email: email,
            password: password
        }).then(function(val) {
            svc.token = val.data
            $window.localStorage.token = svc.token;
            svc.getUser().then(function(res) {
                $window.localStorage.user = JSON.stringify(res.data)
                return svc.getUser()
            })
        })
    }
    this.register = function(email, username, password) {
        return $http.post('/api/users', {
            email: email,
            password: password,
            username: username
        })
    }
})



angular.module('app').factory('auth', function($rootScope, $q, $window) {
    return {
        //add our header to every request
        request: function(config) {
            config.headers = config.headers || {};
            if ($window.localStorage.token) {
                if ($window.localStorage.user) {
                    $rootScope.user = JSON.parse($window.localStorage.user)
                }
                config.headers['X-Auth'] = $window.localStorage.token
            }
            return config
        },
        response: function(response) {
            if (response.status === 401) {
                // handle the case where the user is not authenticated
            }
            return response || $q.when(response);
        }
    };
});

angular.module('app').config(function($httpProvider) {
    $httpProvider.interceptors.push('auth');
});

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

angular.module('app').controller('ProjectPageCtrl', function($scope, $routeParams, $location, ProjectsSvc, InstancesSvc, SessionSvc, toaster) {
    ProjectsSvc.fetchOne($routeParams.id).then(function(res) {
        $scope.project = res.data
        $scope.templates = $scope.project.templates
        $scope.instances = $scope.project.instances
        $scope.hasTemplates = $scope.templates.length
        $scope.hasInstances = $scope.instances.length
        SessionSvc.getProjectSessions($routeParams.id).then(function(res) {
            $scope.sessions = res.data
            $scope.hasSessions = $scope.sessions.length
        })
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
            if (res.data == "Not Unique") {
                toaster.pop({
                    type: 'error',
                    title: "Template Error",
                    body: "Template fields must have unique names",
                    showCloseButton: true,
                    timeout: 3000
                });
            } else {
                toaster.pop({
                    type: 'error',
                    title: "Template Error",
                    body: "You must give your template and all fields a name",
                    showCloseButton: true,
                    timeout: 3000
                });
            }
        })

    }
    $scope.cancel = function() {
        $location.path('/projects/' + $routeParams.id);
    }

    $scope.delete = function() {
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
            //TODO: Add feedback to show server is validating files, if success, redirect to session page, else show helpful error
            $scope.loading = true
            $scope.progressText = "Uploading"
            $scope.progressAmount = "1"
            Upload.upload({
                url: '/api/projects/' + $routeParams.id + '/sessions',
                arrayKey: '',
                data: {
                    files: [$scope.zipFile, $scope.csvFile, $scope.obsFile, $scope.ephemFile]
                }
            }).then(function(res) {
                $scope.progressAmount = 100
                $scope.progressAmount = "Done!"
                $location.path('/projects/' + $routeParams.id + '/sessions/' + res.data._id)
                toaster.pop({
                    type: 'success',
                    title: "Session Created",
                    showCloseButton: true,
                    timeout: 3000
                });
            }, function(err) {
                if (err.data == "OBS Range") {
                    fileError("Obs File Error", "OBS file does not cover data time range", "obsError")
                }
                if (err.data == "NAV Range") {
                    fileError("Ephemeris File Error", "Ephermeris file does not cover data time range", "ephemError")

                }
                if (err.data == "Missing Data") {
                    fileError("Data Error", "A data file specified in the CSV was not found in the Zip File", "zipError")
                }
                if (err.data == "No Instance") {
                    fileError("Data Error", "An instance in your CSV file could not be found in this project", "csvError")
                }
            }, function(uploadEvent) {
                if (uploadEvent.loaded < uploadEvent.total) {
                    $scope.progressAmount = Math.floor(100 * (uploadEvent.loaded / uploadEvent.total) * (7 / 10))
                    $scope.progressText = "Uploading " + $scope.progressAmount + "%"
                } else {
                    $scope.progressAmount = 70
                    $scope.progressText = "Validating Files"
                }
            })
        }
    }
})

angular.module('app').controller('SessionCtrl', function($scope, $interval, $routeParams, $location, toaster, $timeout, SessionSvc, InstancesSvc, ProcessSvc) {
    var processRunning = 0
    var prevProcessRunning = 0

    function refreshSession() {
        SessionSvc.getSession($routeParams.id, $routeParams.sessionId).then(function(res) {
            $scope.session = res.data
            var startTime = new Date(res.data.startTime)
            $scope.dateString = startTime.getDate() + "/" + startTime.getMonth() + "/" + (startTime.getYear() - 100)
            $scope.timeString = startTime.getHours() + ":" + startTime.getMinutes()

            $scope.processes = annotateProcesses($scope.session.processes)


            function annotateProcesses(processes) {
                for (var i = 0; i < processes.length; i++) {
                    if (processes[i].runState === "Not Run") {
                        processes[i].runState = 0
                        processes[i].hasRun = false
                        processes[i].url = "/#/projects/" + $scope.session.project + "/sessions/" + $scope.session._id + "/" + processes[i].indexName
                    } else if (processes[i].runState === "Running") {
                        processes[i].runState = 1
                        processes[i].hasRun = true
                        processes[i].url = ""
                        processRunning += 1
                    } else if (processes[i].runState === "Error") {
                        processes[i].runState = -1
                        processes[i].hasRun = true
                        processes[i].url = ""
                    } else {
                        processes[i].runState = 2
                        processes[i].hasRun = true
                        processes[i].url = ""
                    }
                    return processes
                        //$scope.session.processes[i].runState = 2
                }
            }

            prevProcessRunning = processRunning


            if (processRunning) {
                var pollInterval = $interval(function() {
                    ProcessSvc.pollProcess($routeParams.id, $routeParams.sessionId).then(function(res) {
                        processRunning = 0
                        $scope.processes = annotateProcesses(res.data)
                        if (processRunning < prevProcessRunning) {
                            refreshSession()
                        }
                        prevProcessRunning = processRunning
                        if (processRunning == 0) {
                            $interval.cancel(pollInterval)
                        }
                    })
                }, 500)

            }
            $scope.hasProcesses = false
            if ($scope.session.processes.length > 0) {
                $scope.hasProcesses = true
            }

            $scope.isDisabled = function(process) {
                if (process.runState == 0) {
                    return ""
                } else {
                    return "disabled"
                }
            }


            function getInstance(i) {
                if (i < $scope.session.sessionInstances.length) {
                    InstancesSvc.getInstance($routeParams.id, $scope.session.sessionInstances[i].instanceId).then(function(res) {
                        $scope.session.sessionInstances[i]["instance"] = res.data
                        getInstance(i + 1)
                    })
                }
            }

            getInstance(0)


            $scope.getCSV = function() {
                SessionSvc.getDataCsvs($routeParams.id, $routeParams.sessionId).then(function(res) {

                    var a = document.createElement('a');
                    var blob = new Blob([res.data], { 'type': "application/octet-stream" });
                    a.href = URL.createObjectURL(blob);
                    a.download = "data.zip";
                    a.click();
                })
            }

            $scope.delete = function() {
                SessionSvc.deleteSession($routeParams.id, $routeParams.sessionId).then(function(res) {
                    toaster.pop({
                        type: 'success',
                        title: "Session Deleted",
                        showCloseButton: true,
                        timeout: 3000
                    });
                    $location.path('/projects/' + $routeParams.id)
                })
            }

        })
    }
    refreshSession()
})

angular.module('app').controller('LoginCtrl', function($routeParams, $rootScope, $scope, $location, UserSvc, toaster) {
    $scope.login = function() {
        UserSvc.login($scope.email, $scope.password).then(function(res) {
            if ($routeParams.then) {
                $location.url('/' + $routeParams.then)
            } else {
                $location.path('/')
            }
            $location.search('then', null)
            toaster.pop({
                type: 'success',
                title: "Logged In",
                showCloseButton: true,
                timeout: 3000
            });
        }).catch(function(res) {
            toaster.pop({
                type: 'error',
                title: "Error",
                body: "Your email or password was incorrect",
                showCloseButton: true,
                timeout: 3000
            });
        })
    }
})

angular.module('app').controller('RegisterCtrl', function($scope, $location, UserSvc, toaster) {
    $scope.register = function() {
        if ($scope.password == $scope.passwordConfirm) {
            UserSvc.register($scope.email, $scope.username, $scope.password).then(function(res) {
                $location.path('/');
                toaster.pop({
                    type: 'success',
                    title: "Account Created",
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
        } else {
            toaster.pop({
                type: 'error',
                title: "Error",
                body: "Your passwords don't match",
                showCloseButton: true,
                timeout: 3000
            });
        }
    }
})

angular.module('app').controller('LogoutCtrl', function($scope, $location, toaster, $window, $rootScope) {
    $window.localStorage.clear()
    $rootScope.user = undefined
    toaster.pop({
        type: 'success',
        title: "Logged Out",
        showCloseButton: true,
        timeout: 3000
    });
    $location.path('/login')
})

angular.module('app').controller('ProcessCtrl', function($scope, $routeParams, toaster, $location, ProcessSvc) {
    ProcessSvc.getProcess($routeParams.processName).then(function(processObj) {
        $scope.process = processObj.data
        $scope.extraData = {}
        for (var i = 0; i < $scope.process.extraData.length; i++) {
            $scope.extraData[$scope.process.extraData[i]] = ""
        }

        $scope.extraDataRequired = false

        if (Object.keys($scope.extraData).length > 0) {
            $scope.extraDataRequired = true
        }


        $scope.start = function() {
            ProcessSvc.startProcess($routeParams.id, $routeParams.sessionId, $routeParams.processName, $scope.extraData).then(function(res) {

                toaster.pop({
                    type: 'success',
                    title: "Process " + $scope.process.namePretty + " started",
                    showCloseButton: true,
                    timeout: 3000
                });
                $location.path("/projects/" + $routeParams.id + "/sessions/" + $routeParams.sessionId)

            }).catch(function(res) {
                if (res.status == 400) {
                    if (res.data == "Already Run") {
                        toaster.pop({
                            type: 'error',
                            title: "Error",
                            body: "Process already ran",
                            showCloseButton: true,
                            timeout: 3000
                        });
                    } else {
                        toaster.pop({
                            type: 'error',
                            title: "Error",
                            body: "The process could not be started, check extra input values given",
                            showCloseButton: true,
                            timeout: 3000
                        });
                    }
                }
            })
        }
    })
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