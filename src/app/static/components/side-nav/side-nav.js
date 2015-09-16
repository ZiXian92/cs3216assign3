var sideNav = angular.module('sideNav', ['ngMaterial', 'ngMdIcons']);

sideNav.directive('sideNav', ['sidenavService', function(sidenavService){
	return {
		restrict: 'A',
		templateUrl: '/static/components/side-nav/side-nav.html',
		scope: {
			page: '='
		},
		controller: function($scope, sidenavService){
			$scope.$watch('page', function(newVal, oldVal, scope){
				console.log(newVal);
			});

			// Event Handlers
			$scope.onMenuSelect = function(menu){
				sidenavService.closeSidenav();
				$scope.$emit('pageChange', menu);
			};
		},
		link: function(scope, element, attrs){

		}
	};
}]).factory('sidenavService', ['$mdSidenav', function($mdSidenav){
	return {
		openSidenav: function(){ $mdSidenav('side-bar').toggle(); },
		closeSidenav: function(){ $mdSidenav('side-bar').close(); }
	};
}]);