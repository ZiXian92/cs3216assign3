var titleBar = angular.module('titleBar', ['ngMaterial', 'sideNav', 'ngMdIcons', 'facebook']);

titleBar.directive('titleBar', ['sidenavService', function(sidenavService){
	return {
		restrict: 'A',
		templateUrl: '/static/components/title-bar/title-bar.html',
		scope: true,
		controller: function($scope, $location){
			$scope.showSideBar = sidenavService.openSidenav;

			$scope.onClickLogo = function(){
				$location.path('/');
			};
		}, link: function(scope, element, attrs){
			
		}
	};
}]);