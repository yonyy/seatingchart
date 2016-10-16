'use strict';
angular.module('app').controller('roomFormController',
['$rootScope', '$scope', '$state', '$stateParams', '$filter', 'resource', '$uibModal', 'growl', 'textParser',
function($rootScope, $scope, $state, $stateParams, $filter, resource, $uibModal, growl, textParser) {
	var self = this;
	self.rooms = [{name: 'Sample 1', value: 1},{name: 'Sample 2', value: 1}, {name: '--Select--', value: null}];
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

	self.newRoom = {};
	self.newRoster = {};
	self.manualPaste = false;

	self.error = false;

	$scope.students;
	$scope.success;
    $scope.filename;

	resource.rosters.getRosters({}, 
		function success (rosters){
				self.rosters = rosters;
				self.rosters.push({rosterName: '--Selected--', students: null});
				self.selectedRoster = self.rosters[self.rosters.length-1];
		}, function error(err) {
			growl.error('Error getting rosters');
		}
	);

	self.noInputs = function() {
		if (!self.newRoom.width && !self.newRoom.height && !self.newRoom.name) {
			self.isNewRoster = false;
            return true;
		}
        self.isNewRoster = true;
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
        self.newRoster.rosterName = $scope.filename;
        if (value) self.newRoster.totalStudents = self.newRoster.students.length;
    });

    self.verifyAndGo = function() {
    	if (rfc.roomForm.$invalid) {
    		self.message = 'Form is incomplete. Make sure all fields are completed'
    		return false;
    	}
    	var numStudents = (self.selectedRoster.students) ? self.selectedRoster.students.length : self.newRoster.students.length;
    	var width = (self.selectedExistingRoom.value) ? self.selectedExistingRoom.width : self.newRoom.width;
    	var height = (self.selectedExistingRoom.value) ? self.selectedExistingRoom.height : self.newRoom.height;

    	if (width * height < numStudents) { 
    		self.error = true;
    		self.message = 'Invalid dimensions! Not enough seats';
    		return false;
    	}

        self.upload();
    }

    self.upload = function() {
        var roomID = 0;
        var rosterID = 0;

        if (self.isNewRoom) {
            resource.rooms.addRoom({room: self.newRoom},
                function success (room) {
                    growl.success('Successfully created new room');
                    roomID = room._id;
                }, function error(err) {
                    growl.error('Error occurred generating new room');
                });
        } else roomID = self.selectedExistingRoom._id;

        if (self.isNewRoster) {
            resource.rosters.addRoster({roster: self.newRoster},
                function success (roster) {
                    growl.success('Successfully created new roster');
                    rosterID = roster._id;
                }, function error(err) {
                    growl.error('Error occured generating new roster');
                });
        } else roomID = self.selectedRoster._id;
    
        $state.go('dashboard.room', {roomID: roomID, rosterID: rosterID});
    }

}]);