'use strict';
angular.module('app').controller('roomFormController',
['$rootScope', '$scope', '$state', '$stateParams', '$filter', 'resource', '$uibModal', 'growl', 'textParser',
function($rootScope, $scope, $state, $stateParams, $filter, resource, $uibModal, growl, textParser) {
	var self = this;
	self.rooms = [];
	self.rosters = [];
    self.columns = [
    	{value: "Last Name"},
    	{value: "First Name"},
    	{value: "Email"},
    	{value: "Section"},
    	{value: "Exam ID"},
    	{value: "Field 6"}
    ];

    self.delimeters = [
    	{name: "Tab", value: '	'},
    	{name: "Comma", value: ','},
    	{name: "Space", value: ' '}
    ];

	self.delimeter = self.delimeters[0].value;
	self.selectedExistingRoom = self.rooms[2];
	self.selectedRoster = null;

	self.newRoom = {type: "Class"};
	self.newRoster = {};
	self.manualPaste = false;

	self.error = false;
    self.isNewRoom = false;
    self.isNewRoster = false;

	$scope.students;
	$scope.success;
    $scope.filename;

    resource.rooms.getRooms({},
        function success(rooms) {
            self.rooms = rooms;
            self.rooms.push({name: '--Select--', _id: null});
            self.selectedExistingRoom = self.rooms[self.rooms.length-1];
            console.log(rooms);
        })

	resource.rosters.getRosters({}, 
		function success (rosters){
				self.rosters = rosters;
				self.rosters.push({name: '--Select--', students: null});
				self.selectedRoster = self.rosters[self.rosters.length-1];
                console.log(rosters);
		}, function error(err) {
			growl.error('Error getting rosters');
		}
	);

	self.noInputs = function() {
		if (!self.newRoom.width && !self.newRoom.height && !self.newRoom.name) {
			self.isNewRoom = false;
            return true;
		}
        self.isNewRoom = true;
		return false;
	}

	self.noRoster = function() {
		if (!self.newRoster.rosterName && !self.manualRosterText && !self.newRoster.students) {
			self.isNewRoster = false;
            return true;
		}
        self.isNewRoster = true;
		return false;
	}

    self.parse = function() {
      var pack = textParser.tp.readText(self.columns, self.manualRosterText, self.delimeter);
      $scope.students = pack.students;
      $scope.success = pack.success;
      self.manualRosterText = '';
    };

    $scope.$watch('students', function(value){
    	self.newRoster.students = value;
        self.newRoster.name = $scope.filename;
        if (value) self.newRoster.totalStudents = self.newRoster.students.length;
    });

    self.verifyAndGo = function() {
        console.log('verifying')
    	if (self.roomForm.$invalid) {
            self.error = true;
    		self.message = 'Form is incomplete. Make sure all fields are completed'
    		return false;
    	}

    	var numStudents = (self.selectedRoster.students) ? self.selectedRoster.students.length : self.newRoster.students.length;
    	var width = (self.selectedExistingRoom._id) ? self.selectedExistingRoom.width : self.newRoom.width;
    	var height = (self.selectedExistingRoom._id) ? self.selectedExistingRoom.height : self.newRoom.height;

    	if (width * height < numStudents) { 
    		self.error = true;
    		self.message = 'Invalid dimensions! Not enough seats.';
    		return false;
    	}

        console.log(self.newRoom);
        console.log(self.newRoster);
        self.uploadRoom();
    }

    self.uploadRoom = function() {
        if (self.isNewRoom) {
            self.newRoom.totalSeats = self.newRoom.width * self.newRoom.height;
 
            resource.rooms.addRoom({room: self.newRoom},
                function success (room) {
                    growl.success('Successfully created new room');
                    self.uploadRoster(room._id);
                }, function error(err) {
                    console.log(err);
                    growl.error('Error occurred generating new room');
                });
        } else {self.uploadRoster(self.selectedExistingRoom._id)};
    }

    self.uploadRoster = function(roomID) {
                            console.log(2);
        if (self.isNewRoster) {
            resource.rosters.addRoster({roster: self.newRoster},
                function success (roster) {
                    growl.success('Successfully created new roster');
                    self.createEvent(roomID, roster._id);
                }, function error(err) {
                    console.log(err);
                    growl.error('Error occured generating new roster');
                });
        } else {self.createEvent(roomID, self.selectedRoster._id)};
    }
    
    self.createEvent = function(roomID, rosterID) {
                        console.log('here');
        resource.events.addEvent({event: {roomID: roomID, rosterID: rosterID}},
            function success (e) {
                console.log(e);
                $state.go('dashboard.roster', {id: e._id});
            }, function error(err) {
                console.log(err);
            });
    }

}]);