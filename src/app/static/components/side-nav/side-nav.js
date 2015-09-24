var sideNav = angular.module('sideNav', ['ngMaterial', 'ngMdIcons', 'facebook']);

sideNav.directive('sideNav', ['$location', '$mdDialog', 'sidenavService', 'fbService', function ($location, $mdDialog, sidenavService, fbService) {
	return {
		restrict: 'A',
		templateUrl: '/static/components/side-nav/side-nav.html',
		scope: {
			page: '='
		},
		controller: function ($scope, $mdDialog, sidenavService, fbService) {

			$scope.$watch('page', function (newVal, oldVal, scope) {
				console.log(newVal);
			});
			$scope.$watch(fbService.isLoggedIn, function (newVal, oldVal, scope) {
				scope.user = newVal ? fbService.getUser() : undefined;
			});

			$scope.isLoggedIn = fbService.isLoggedIn;

			// Event Handlers
			$scope.onClickShare = function () {
				fbService.share('http://tldr.sshz.org', function (response) {
					if (!angular.isDefined(response)) {
						$mdDialog.show($mdDialog.alert()
							.clickOutsideToClose(true)
							.title('Thanks for spreading the word!')
							.ok('Ok'));
					}
				});
			};

			$scope.onMenuSelect = function (menu, view) {
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
				'view': '/feed/popular',
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
			// 	'title': 'Work',
			// 	'iid': 'work',
			// 	'view': '/feed/4',
			// 	'icon': 'work'
			// }, {
				'title': 'Lifestyle',
				'iid': 'lifestyle',
				'view': '/feed/5',
				'icon': 'mood'
			}, {
				'title': 'Self-help',
				'iid': 'self-help',
				'view': '/feed/1',
				'icon': 'people'
			}, {
				'title': 'About tl;dr',
				'iid': 'about',
				'view': '/about',
				'icon': 'info'
			}, {
				'title': 'Feedback to tl;dr',
				'iid': 'feedback',
				'view': '/feedback',
				'icon': 'rate_review'
			}];
		},
		link: function (scope, element, attrs) {

		}
	};
}]).factory('sidenavService', ['$mdSidenav', function ($mdSidenav) {
	return {
		openSidenav: function () {
			$mdSidenav('side-bar').toggle();
		},
		closeSidenav: function () {
			$mdSidenav('side-bar').close();
		}
	};
}]);