'use strict';
var app = angular.module('app', ['ngResource', 'ui.router', 'ngAnimate', 'ui.bootstrap', 'angular-growl']);

app.config(['$stateProvider', '$urlRouterProvider', '$compileProvider', '$httpProvider', 'growlProvider',
function($stateProvider, $urlRouterProvider, $compileProvider, $httpProvider, growlProvider){
 	growlProvider.globalTimeToLive(5000);
	$urlRouterProvider.otherwise('/dashboard/form');
	$stateProvider
		.state('dashboard', {
			url: '/dashboard/',
			views: {
				'body' : {
					templateUrl: 'partials/main.html',
					controller: 'mainController as mc',
					abstract: true
				}
			}
		})
		.state('dashboard.form', {
			url: 'form',
			views: {
				'content' : {
					templateUrl: 'partials/roomForm.html',
					controller: 'roomFormController as rfc'
				}
			}
		})
		.state('dashboard.roster', {
			url: 'roster/:id',
			views: {
				'content' : {
					templateUrl: 'partials/roomRoster.html',
					controller: 'roomRosterController as rrc'
				}
			},
			params: {
				id: null
			}
		})
		.state('dashboard.room', {
			url: 'room/:id',
			views: {
				'content' : {
					templateUrl: 'partials/roomDraft.html',
					controller: 'roomDraftController as rdc'
				}
			},
			params: {
				id: null
			}
		})
		.state('dashboard.publish', {
			url: 'publish/:id',
			views: {
				'content' : {
					templateUrl: 'partials/roomPublish.html',
					controller: 'roomPublishController as rpc'
				}
			},
			params: {
				id: null
			}
		})
		.state('dashboard.events', {
			url: 'events',
			views: {
				'content' : {
					templateUrl: 'partials/events.html',
					controller: 'eventsController as ec'
				}
			}
		})
		.state('dashboard.rosters', {
			url: 'rosters',
			views: {
				'content' : {
					templateUrl: 'partials/rosters.html',
					controller: 'rostersController as rc'
				}
			}
		})
		.state('dashboard.openRoster', {
			url: 'open/:id',
			views: {
				'content' : {
					templateUrl: 'partials/roster.html',
					controller : 'rosterController as rc'
				}
			},
			params: {
				id: null
			}
		})
		.state('dashboard.rooms', {
			url: 'rooms',
			views: {
				'content': {
					templateUrl: 'partials/rooms.html',
					controller: 'roomsController as rc'
				}
			}
		});
}
]);

app.run(['$rootScope', '$state', '$stateParams',
  function ($rootScope, $state, $stateParams) {
    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;
}]);

app.factory('resource', ['$resource', function($resource) {
	var self = this;

	self.rosters = $resource('/api/rosters', null,
		{
			'getRosters' : {url: '/api/rosters', method : 'GET', isArray: true, params: {}},
			'getByID' : {url: '/api/rosters/:id', method: 'GET', isArray: false, params: {id: '@id'}},
			'addRoster' : {url: '/api/rosters', method: 'POST', isArray: false, params: {roster: '@roster'}},
			'updateRoster' : {url: '/api/rosters/:id', method: 'PUT', isArray: false, params: {id: '@id', roster: '@roster'}},
			'deleteRoster': {url: '/api/rosters/:id', method: 'DELETE', isArray: false, params: {id: '@id'}}
		}
	);

	self.rooms = $resource('/api/rooms', null,
		{
			'addRoom' : {url: '/api/rooms', method: 'POST', isArray: false, params: {room: '@room'}},
			'getRooms' : {url: '/api/rooms', method: 'GET', isArray: true, params: {}},
			'getByID' : {url: '/api/rooms/:id', method: 'GET', isArray: false, params: {id: '@id'}},
			'getClasses' : {url: '/api/rooms/class', method: 'GET', isArray: true, params: {}},
			'getLabs' : {url: '/api/rooms/labs', method: 'GET', isArray: true, params: {}},
			'updateRoom': {url: '/api/rooms/:id', method: 'PUT', isArray: false, params: {id: '@id', room: '@room'}},
			'deleteRoom': {url: '/api/rooms/:id', method: 'DELETE', isArray: false, params: {id: '@id'}}
		}
	);

	self.events = $resource('/api/events', null,
		{
			'addEvent' : {url: '/api/events', method: 'POST', isArray: false, params: {event: '@event'}},
			'editEvent' : {url: '/api/events/:id', method: 'PUT', isArray: false, params: {id: '@id', event: '@event'}},
			'getEvents' : {url: '/api/events', method: 'GET', isArray: true, params: {}},
			'getByID' : {url: '/api/events/:id', method: 'GET', isArray: false, params: {id: '@id'}},
			'deleteEvent': {url: '/api/events/:id', method: 'DELETE', isArray: false, params: {id: '@id'}},
			'updateEvent': {url: '/api/events/:id', method: 'PUT', isArray: false, params: {id: '@id', event: '@event'}}
		}
	);

	return self;
}]);

app.factory('textParser', function() {
	var tp = {};
	var success = false;
	var fnameIndex = 3;	// default from roster
	var lnameIndex = 2;	// default from roster
	var emailIndex = 8;	// default from roster
	var studentIndex = 2; // if the name is arranged [lastname, firstname]
	var examIndex = -1;

	/* Reads from vm.columns to define where a student's last name,
	* first name, and email is located */
	tp.readText = function(columns, manualRoster, deli) {
		for (var i = 0; i < columns.length; i++) {
			var cData = columns[i].value.toLowerCase();
			if (cData === 'first name') {
				fnameIndex = i;
			} else if (cData ==='last name') {
				lnameIndex = i;
			} else if (cData === 'student') {
				lnameIndex = -1;
				fnameIndex = -1;
				studentIndex = i;
			} else if (cData === 'email') {
				emailIndex = i;
			} else if (cData == 'exam id') {
				examIndex = i;
			}
		}

		var data = manualRoster.split('\n');
		var pack = tp.createUsers(data,0,deli);
		return pack;
	};

	/* Creates users from the text. Depends upon fnameIndex, lnameIndex
	* and emailIndex */
	tp.createUsers = function (csv, start, deli) {
		var stud = [];
		for (var i = start; i < csv.length; i++) {
			var info = csv[i].split(deli);
			var fname = '';
			var lname = '';
			var sname = null;
			var exam = '';

			if (lnameIndex !== -1 && fnameIndex !== -1) {
				fname = info[fnameIndex];
				lname = info[lnameIndex];
			} else {
				sname = info[studentIndex].split(', ');
				lname = sname[0];
				fname = sname[1];
			}
	
			var email = info[emailIndex];
			if (examIndex != -1) exam = info[examIndex];
			else exam = (i-start + 1).toString();

			if (!fname || !lname || !email) { continue; }
			stud.push({
				firstName: fname.replace(/['"]+/g, ''),
				lastName: lname.replace(/['"]+/g, ''),
				email: email,
				studentID: exam,
				isLeftHanded: false
			});
		}

		if (!stud.length) { success = false; }
		else { success = true; }
		return {
			students : stud,
			success : success
		};
	};

	return {
		tp: tp
	};
});

/* Directive, file-reader, to read file upload */
app.directive('ngFileReader', function() {

    var fnameIndex = 3;	// default from roster
    var lnameIndex = 2;	// default from roster
    var emailIndex = 8;	// default from roster
    var deli = ',';
    var success = false;
    var students = [];

    /* Creates users from the text. Depends upon fnameIndex, lnameIndex
    * and emailIndex */
    var createUsers = function (csv, start) {
        var stud = [];
        for (var i = start; i < csv.length; i++) {
            var info = csv[i].split(deli);
            var fname = info[fnameIndex];
            var lname = info[lnameIndex];
            var email = info[emailIndex];
            //console.log(fname + ' ' + lname + ' ' + email)
            if (!fname || !lname || !email) { continue; }
            stud.push({
                firstName: fname.replace(/['"]+/g, ''),
                lastName: lname.replace(/['"]+/g, ''),
                email: email,
                studentID: (i-start + 1).toString(),
                isLeftHanded: false
            });
        }
        if (!stud.length) { success = false; }
        else { success = true; }
        return stud;
    };

    /* Takes in a csv text file and finds the row to begin
    * parsing */
    /* Uploaded file MUST follow default format */
    var parseFile = function(csv) {
        var j = 0;
        while (csv[j].split(',')[0] !== 'Sec ID') {
            j++;
        }
        return createUsers(csv,j+1);
    };

    /* Function that converts an XLSX file into a CSV file */
    var createCSV = function(workbook) {
        var sheetname = workbook.SheetNames[0];
        var csv = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetname]);
        var s = parseFile(csv.split('\n'));
        return s;
    };

    return {
    	restrict: 'A',
        link: function($scope, element) {
            $(element).on('change', function(changeEvent) {
                var files = changeEvent.target.files;
                var extension = files[0].name.split('.').pop();
                if (files.length) {
                    var r = new FileReader();
                    r.onload = function(e) {
                        var contents = e.target.result;
                     	if (extension === 'csv') {
                            students = parseFile(contents.split('\n'));
                        } else {
                            var workbook = XLSX.read(contents, {type: 'binary'});
                            students = createCSV(workbook);
                        }
                        $scope.$apply(function(){
                        	$scope.students = students;
                        	$scope.filename = files[0].name;
                        	$scope.success = success;
                        });
                    };

                    r.readAsBinaryString(files[0]);
                    //$(this).val(null);
                }
            });
        }
    };
});
