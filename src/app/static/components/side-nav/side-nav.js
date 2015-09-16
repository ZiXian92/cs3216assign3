var sideNav = angular.module('sideNav', ['ngMaterial', 'ngMdIcons']);

sideNav.directive('sideNav', ['$location', 'sidenavService', function($location, sidenavService){
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
			$scope.onMenuSelect = function(menu, view){
				sidenavService.closeSidenav();
				$scope.$emit('pageChange', menu);
				$location.path(view);
			};

			$scope.sideMenuItems = [{
				'title': 'Latest Articles',
				'iid': 'latest',
				'view': '/feed',
				'icon': 'new_releases'
			}, {
				'title': 'Popular Articles',
				'iid': 'popular',
				'view': '/feed',
				'icon': 'trending_up'
			}, {
				'title': 'Money',
				'iid': 'money',
				'view': '/feed/2',
				'icon': 'attach_money'
			}, {
				'title': 'Technology',
				'iid': 'technology',
				'view': '/feed/3',
				'icon': 'devices'
			}, {
				'title': 'Work',
				'iid': 'work',
				'view': '/feed/4',
				'icon': 'work'
			}, {
				'title': 'Lifestyle',
				'iid': 'lifestyle',
				'view': '/feed/5',
				'icon': 'mood'
			}, {
				'title': 'About tl;dr',
				'iid': 'about',
				'view': '/about',
				'icon': 'info'
			}];
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