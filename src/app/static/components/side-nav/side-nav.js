var sideNav = angular.module('sideNav', ['ngMaterial']);

sideNav.directive('sideNav', ['$mdSidenav', function($mdSidenav){
	return {
		restrict: 'A',
		templateUrl: '/static/components/side-nav/side-nav.html',
		scope: {
			page: '='
		},
		controller: function($scope, $mdSidenav){
			console.log($scope.page);
			$scope.$watch('page', function(newVal, oldVal, scope){
				console.log(newVal);
			});

			// Event Handlers
			$scope.onMenuSelect = function(menu){
				console.log('Changing page');
				$mdSidenav('side-bar').close();
				$scope.$emit('pageChange', menu);
			};
		},
		link: function(scope, element, attrs){

		}
	};
}]);