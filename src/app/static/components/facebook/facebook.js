var fb = angular.module('facebook', ['ngMaterial', 'ngRoute']);

fb.factory('fbService', ['$window', function($window){
	var user = undefined;

	// Initializing Facebook SDK
	$window.fbAsyncInit = function() {
		FB.init({
			appId: '1663895923894184',
			cookie: true,
			status: true,
			xfbml: true,
			version: 'v2.4'
		});

		FB.Event.subscribe('auth.login', function(response){
			if(response && response.status==='connected'){
				user = {
					token: response.authResponse.accessToken,
					id: response.authResponse.userID
				};
				user.image = 'http://graph.facebook.com/'+user.id+'/picture?type=square&width=200&height=200';
				FB.api('/me', function(response){
					user.name = response.name;
				});
			}
		});

		FB.Event.subscribe('auth.logout', function(response){
			user = undefined;
		});

		FB.getLoginStatus(function(response){
			if(response.status==='connected'){
				user = {
					token: response.authResponse.accessToken,
					id: response.authResponse.userID
				};
				user.image = 'http://graph.facebook.com/'+user.id+'/picture?type=square&width=200&height=200';
				FB.api('/me', function(response){
					user.name = response.name;
				});
			}
		});
	};
	(function(d, s, id){
		var js, fjs = d.getElementsByTagName(s)[0];
	    if (d.getElementById(id)) {return;}
	    js = d.createElement(s); js.id = id;
	    js.src = "//connect.facebook.net/en_US/sdk.js";
	    fjs.parentNode.insertBefore(js, fjs);
	}(document, 'script', 'facebook-jssdk'));
	
	// Method definitions
	var getUser = function(){
		return isLoggedIn() ? angular.extend({}, user) : user;
	};

	var isLoggedIn = function(){
		return angular.isDefined(user);
	};

	/*
	 * @param {function()=} callback
	 */
	var login = function(callback){
		FB.login(function(response){
			if(angular.isFunction(callback)){
				callback();
			}
		});
	};
	var logout = function(callback){
		FB.logout(function(response){
			if(angular.isFunction(callback)){
				callback();
			}
		});
	};

	/*
	 * @param {String} url
	 * @param {function()=} callback
	 */
	var share = function(url, callback){
		FB.ui({
			method: 'share',
			href: url
		}, function(response){
			if(angular.isFunction(callback)){
				callback();
			}
		});
	};

	return {
		getUser: getUser,
		isLoggedIn: isLoggedIn,
		login: login,
		logout: logout,
		share: share
	};
}]).directive('fbMenu', ['fbService', '$mdDialog', '$location', '$route', function(fbService, $mdDialog, $location, $route){
	return {
		restrict: 'A',
		replace: true,
		templateUrl: '/static/components/facebook/fb-menu.html',
		controller: function($scope, fbService, $mdToast){
			$scope.isLoggedIn = fbService.isLoggedIn;
			$scope.login = function(){
				fbService.login(function(){
					$route.reload();
					// $scope.$apply();
					// window.location.reload();
				});
			};
			$scope.logout = function(){
				fbService.logout(function(){
					$location.path('/');
					$scope.$apply();
					// window.location.href = '/';
				});
			};
			$scope.share = function(){
				fbService.share('http://tldr.sshz.org', function(response){
					if(!angular.isDefined(response)){
						$mdDialog.show($mdDialog.alert()
							.clickOutsideToClose(true)
							.title('Thanks for spreading the word!')
							.ok('Ok'));
					}
				});
			};
		}, link: function(scope, element, attrs){

		}
	};
}]);