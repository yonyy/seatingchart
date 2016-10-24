'use strict';
angular.module('app').controller('roomsController',
['$rootScope', '$scope', '$state', '$stateParams', '$filter', 'resource', '$uibModal', 'growl', 'textParser',
function($rootScope, $scope, $state, $stateParams, $filter, resource, $uibModal, growl, textParser) {
    var self = this;
    self.rooms = null;

    resource.rooms.getRooms({},
        function success(rooms) {
            self.rooms = rooms;
        }, function error(err) {
            console.log(err);
        }
    );

    self.open = function (id) {
        $state.go('dashboard.openRoom', {id: id});
    }

    self.delete = function(id, index) {
        resource.rooms.deleteRoom({id: id},
            function success(r) {
                growl.success('Deleted ' + r.name);
                self.rooms.splice(index,1);
            }, function error(err) {
                growl.error('Error deleting');
            }
        );
    }

}]);