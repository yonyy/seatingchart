'use strict';
angular.module('app').controller('rostersController',
['$rootScope', '$scope', '$state', '$stateParams', '$filter', 'resource', '$uibModal', 'growl', 'textParser',
function($rootScope, $scope, $state, $stateParams, $filter, resource, $uibModal, growl, textParser) {
    var self = this;
    self.rosters = null;

    resource.rosters.getRosters({},
        function success(rosters) {
            self.rosters = rosters;
        }, function error(err) {
            console.log(err);
        }
    );

    self.open = function (id) {
        $state.go('dashboard.openRoster', {id: id});
    }

    self.delete = function(id, index) {
        resource.rosters.deleteRoster({id: id},
            function success(r) {
                growl.success('Deleted ' + r.name);
                self.rosters.splice(index,1);
            }, function error(err) {
                growl.error('Error deleting');
            }
        );
    }

}]);