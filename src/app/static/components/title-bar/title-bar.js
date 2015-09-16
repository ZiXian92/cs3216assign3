var titleBar = angular.module('titleBar', ['ngMaterial', 'sideNav', 'ngMdIcons']);

titleBar.directive('titleBar', ['sidenavService', function(sidenavService){
	return {
		restrict: 'A',
		templateUrl: '/static/components/title-bar/title-bar.html',
		scope: true,
		controller: function($scope, $mdUtil, $mdSidenav){
			$scope.showSideBar = function(){
				sidenavService.openSidenav();
			};
		}, link: function(scope, element, attrs){
			
		}
	};
}]);