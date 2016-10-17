'use strict';
angular.module('app').controller('rosterController',
['$rootScope', '$scope', '$state', '$stateParams', '$filter', 'resource', '$uibModal', 'growl', 'textParser',
function($rootScope, $scope, $state, $stateParams, $filter, resource, $uibModal, growl, textParser) {
	var self = this;
    self.roster = null;
    self.event = null;
    self.saved = true;
    console.log($stateParams.id);

    resource.events.getByID({id: $stateParams.id},
        function success(event) {
            self.event = event;
            resource.rosters.getByID({id: event.rosterID},
                function success(roster) {
                    self.roster = roster;

                }, function error(err) {
                    console.log(err);
                }
            );
        }, function error(err) {
            console.log(err);
        }
    );

    self.continue = function() {
        resource.rosters.updateRoster({id: self.roster._id, roster: self.roster},
            function success(roster) {
                growl.success('Updated Roster');
                $state.go('dashboard.room', {id: $stateParams.id});
            }, function error(err) {
                growl.error('Error updating the roster');
                $state.go('dashboard.room', {id: $stateParams.id});
            });
    }

}]);