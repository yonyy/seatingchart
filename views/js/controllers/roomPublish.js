'use strict';
angular.module('app').controller('roomPublishController',
['$rootScope', '$scope', '$state', '$stateParams', '$filter', 'resource', '$uibModal', 'growl',
function($rootScope, $scope, $state, $stateParams, $filter, resource, $uibModal, growl) {
	var self = this;
	self.events = null;
	self.room = null;
	self.roster = null;
	self.virtualMap = null;
	self.physicalMap = null;
	
    resource.events.getByID({id: $stateParams.id},
        function success(event) {
            self.event = event;
            resource.rooms.getByID({id: event.roomID},
                function success(room) {
                    self.room = room;
                    console.log(room.map);
                    self.virtualMap = room.map[0];
                   	self.physicalMap = room.map[1]
                }, function error(err) {
                    growl.error('Error retrieving room');
                    console.log(err);
                }
            );

            resource.rosters.getByID({id: event.rosterID},
            	function success(roster) {
            		self.roster = roster;
            	}, function error(err) {
            		growl.error('Error retrieving roster');
            	}
            );
        }, function error(err) {
            console.log(err);
        }
    );

    self.cellClass = function(cell) {
    	if (!cell.realCell || !cell.realCell.valid) return 'dead';
    	if (cell.realCell && cell.realCell.leftHanded) return 'left';
    	return 'right';
    }
}])