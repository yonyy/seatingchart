'use strict';
angular.module('app').controller('rosterController',
['$rootScope', '$scope', '$state', '$stateParams', '$filter', 'resource', '$uibModal', 'growl', 'textParser',
function($rootScope, $scope, $state, $stateParams, $filter, resource, $uibModal, growl, textParser) {
	var self = this;
    self.roster = null;
    self.saved = true;
    console.log($stateParams.id);

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
                growl.success('Updated Roster');
            }, function error(err) {
                growl.error('Error updating the roster');
            });
    }

    self.back = function() {
        $state.go('dashboard.rosters');
    }

}]);