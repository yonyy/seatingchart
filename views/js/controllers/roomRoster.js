'use strict';
angular.module('app').controller('roomRosterController',
['$rootScope', '$scope', '$state', '$stateParams', '$filter', 'resource', '$uibModal', 'growl', 'textParser',
function($rootScope, $scope, $state, $stateParams, $filter, resource, $uibModal, growl, textParser) {
	var self = this;
    self.roster = null;
    self.event = null;
    self.saved = true;

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

    self.go = function() {
        $state.go('dashboard.classDraft', {id: $stateParams.id, touched: $stateParams.touched, lab: $stateParams.lab});
    }

    self.continue = function() {
        resource.rosters.updateRoster({id: self.roster._id, roster: self.roster},
            function success(roster) {
                growl.success('Updated Roster');
                self.go();
            }, function error(err) {
                growl.error('Error updating the roster');
                self.go();
            });
    }

}]);