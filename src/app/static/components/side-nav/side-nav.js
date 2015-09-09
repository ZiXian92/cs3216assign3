var sideNav = angular.module('sideNav', ['ngMaterial']);

sideNav.directive('sideNav', function(){
	return {
		restrict: 'A',
		templateUrl: '/static/components/side-nav/side-nav.html',
		scope: true,
		controller: function($scope){

		},
		link: function(scope, element, attrs){
			
		}
	};
});