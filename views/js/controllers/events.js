'use strict';
angular.module('app').controller('eventsController',
['$rootScope', '$scope', '$state', '$stateParams', '$filter', 'resource', '$uibModal', 'growl', 'textParser',
function($rootScope, $scope, $state, $stateParams, $filter, resource, $uibModal, growl, textParser) {
    var self = this;
    self.events = null;

    resource.events.getEvents({},
        function success(events) {
            self.events = events;
            for (var i = 0; i < self.events.length; i++) {
                var event = self.events[i];
                resource.rooms.getByID({id: event.roomID},
                    function success(room) {
                        console.log(room);
                        if (!room.name) event.room = {name: 'Room has been deleted'};
                        else event.room = room;

                    }
                );
                resource.rosters.getByID({id: event.rosterID},
                    function success(roster) {
                        event.roster = roster;
                    }
                );
            }
        }, function error(err) {
            console.log(err);
        }
    );

    self.open = function (event) {
        if (!event.room.totalSeats) {
            growl.error('Can not open because the room has been deleted');
            return;
        }
        $state.go('dashboard.room', {id: event._id});
    }

    self.delete = function(id, index) {
        resource.events.deleteEvent({id: id},
            function success(e) {
                growl.success('Deleted ' + e.name);
                self.events.splice(index,1);
            }, function error(err) {
                growl.error('Error deleting');
            }
        );
    }

}]);