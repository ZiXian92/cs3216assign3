var titleBar = angular.module('titleBar', ['ngMaterial', 'sideNav', 'ngMdIcons', 'facebook', 'ngRoute']);

titleBar.directive('titleBar', ['sidenavService', 'fbService', '$route', '$location', '$mdDialog', function (sidenavService, fbService, $route, $location, $mdDialog) {
	return {
		restrict: 'A',
		templateUrl: '/static/components/title-bar/title-bar.html',
		scope: true,
		controller: function ($scope, $location, fbService, $route, $location, $mdDialog) {
			$scope.showSideBar = sidenavService.openSidenav;
			$scope.isLoggedIn = fbService.isLoggedIn;

			$scope.$watch(fbService.isLoggedIn, function (newVal, oldVal, scope) {
				scope.user = newVal ? fbService.getUser() : undefined;
			});

			$scope.onClickLogo = function () {
				$location.path('/');
			};

			$scope.onClickLogin = function () {
				fbService.login(function () {
					$route.reload();
				});
			};

			$scope.onClickLogout = function () {
				$mdDialog.show($mdDialog.confirm()
						.title('Logging out')
						.content('Are you sure to log out now?')
						.ok('Yes')
						.cancel('Not now')
				).then(function () {
						fbService.logout(function () {
							$location.path('/');
							$scope.$apply();
						});
					});
			};

			$scope.onClickRefresh = function () {
				window.location.reload();
			};

			if (fbService.isLoggedIn()) {
				$route.reload();
			}
		}, link: function (scope, element, attrs) {

		}
	};
}]);