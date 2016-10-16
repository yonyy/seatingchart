'use strict';
angular.module('app').controller('rosterController',
['$rootScope', '$scope', '$state', '$stateParams', '$filter', 'resource', '$uibModal', 'growl', 'textParser',
function($rootScope, $scope, $state, $stateParams, $filter, resource, $uibModal, growl, textParser) {
	var self = this;
	self.room = null;
    self.roster = null;

    resource.room.getByID({id: $stateParams.roomID},
        function success(room) {
            self.room = room;
        }, function error(err) {
            console.log(err);
        }
    );

    resource.roster.getByID({id: $stateParams.rosterID},
        function success(roster) {
            self.roster = roster;
        }, function error(err) {
            console.log(err);
        }
    );

}]);