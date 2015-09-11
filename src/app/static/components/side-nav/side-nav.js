var sideNav = angular.module('sideNav', ['ngMaterial']);

sideNav.directive('sideNav', function(){
	return {
		restrict: 'A',
		templateUrl: '/static/components/side-nav/side-nav.html',
		scope: {
			page: '='
		},
		controller: function($scope){
			console.log($scope.page);
			$scope.$watch('page', function(newVal, oldVal, scope){
				console.log(newVal);
			});

			// Event Handlers
			$scope.onMenuSelect = function(menu){
				console.log('Changing page');
				$scope.$emit('pageChange', menu);
			};
		},
		link: function(scope, element, attrs){

		}
	};
});