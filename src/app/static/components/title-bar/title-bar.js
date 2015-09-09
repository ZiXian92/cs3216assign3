var titleBar = angular.module('titleBar', ['ngMaterial']);

titleBar.directive('titleBar', function($mdSidenav, $mdUtil){
	return {
		restrict: 'A',
		templateUrl: '/static/components/title-bar/title-bar.html',
		scope: true,
		controller: function($scope, $mdUtil, $mdSidenav){
			$scope.showSideBar = function(){
				$mdSidenav('side-bar').toggle();
			};
		}, link: function(scope, element, attrs){
			
		}
	};
});