'use strict';
angular.module('app').controller('roomDraftController',
['$rootScope', '$scope', '$state','$stateParams', '$filter', 'resource', '$uibModal', 'growl',
function($rootScope, $scope, $state, $stateParams, $filter, resource, $uibModal, growl) {
	var self = this;
	growl.success("Hello!");
}]);