'use strict';
angular.module('app').controller('rosterController',
['$rootScope', '$scope', '$state', '$stateParams', '$filter', 'resource', '$uibModal', 'growl', 'textParser',
function($rootScope, $scope, $state, $stateParams, $filter, resource, $uibModal, growl, textParser) {
	var self = this;
    self.roster = null;
    self.saved = true;
    self.columns = [
        {value: "Last Name"},
        {value: "First Name"},
        {value: "Email"},
        {value: "Section"},
        {value: "Exam ID"},
        {value: "Field 6"}
    ];

    self.delimeters = [
        {name: "Tab", value: '  '},
        {name: "Comma", value: ','},
        {name: "Space", value: ' '}
    ];

    self.delimeter = self.delimeters[0].value;
    self.oldRoster = [];
    self.imported = false;
    self.success = false;

    self.parse = function() {
        var pack = textParser.tp.readText(self.columns, self.manualRosterText, self.delimeter);
        
        self.parseStatus = pack.success;
        if (self.parseStatus) {
            growl.success('Parsed Successfully');
            self.oldRoster = JSON.parse(JSON.stringify(self.roster.students));
            self.imported = true;
            self.roster.students = pack.students;
            self.roster.totalStudents = pack.students.length;
        } else {
            growl.error('Error Parsing');
        }
    };

    resource.rosters.getByID({id: $stateParams.id},
        function success(roster) {
            self.roster = roster;

        }, function error(err) {
            console.log(err);
        }
    );

    self.save = function() {
        resource.rosters.updateRoster({id: self.roster._id, roster: self.roster},
            function success(roster) {
                self.success = true;
                growl.success('Updated Roster');
                self.roster = roster;
                self.showDifference();
            }, function error(err) {
                growl.error('Error updating the roster');
            });
    }

    self.back = function() {
        $state.go('dashboard.rosters');
    }

    self.showDifference = function() {
        self.removed = self.oldRoster.filter(function(element,index) {
            for (var i = 0; i < self.roster.students.length; i++) {
                if (self.roster.students[i] === element) {
                    return false;
                }
            }

            return true;
        });

        self.added = self.roster.students.filter(function(element, index) {
            for (var i = 0; i < self.oldRoster.length; i++) {
                if (self.oldRoster[i] === element) {
                    return false;
                }
            }

            return true;
        });
    }

}]);