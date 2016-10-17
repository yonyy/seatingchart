'use strict';
angular.module('app').controller('eventsController',
['$rootScope', '$scope', '$state', '$stateParams', '$filter', 'resource', '$uibModal', 'growl', 'textParser',
function($rootScope, $scope, $state, $stateParams, $filter, resource, $uibModal, growl, textParser) {
    var self = this;
    self.events = null;

    resource.events.getEvents({},
        function success(events) {
            self.events = events;
        }, function error(err) {
            console.log(err);
        }
    );

    self.open = function (id) {
        $state.go('dashboard.room', {id: id});
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