var sideNav = angular.module('sideNav', ['ngMaterial']);

sideNav.directive('sideNav', function(){
	return {
		restrict: 'A',
		templateUrl: '/static/components/side-nav/side-nav.html',
		scope: true,
		controller: function($scope){
			$scope.page = null;

			// Event Handlers
			$scope.onMenuSelect = function(menu){
				$scope.page = menu;
			};
		},
		link: function(scope, element, attrs){

		}
	};
});