var fb = angular.module('facebook', ['ngMaterial']);

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
	var login = function(callback){
		FB.login(function(response){
			callback();
		});
	};
	var logout = function(callback){
		FB.logout(function(response){
			callback();
		});
	};
	var share = function(callback){
		FB.ui({
			method: 'share',
			href: 'http://tldr.sshz.org'
		}, function(response){
			console.log(response);
			callback();
		});
	};

	return {
		getUser: getUser,
		isLoggedIn: isLoggedIn,
		login: login,
		logout: logout,
		share: share
	};
}]).directive('fbMenu', ['fbService', '$mdToast', function(fbService, $mdToast){
	return {
		restrict: 'A',
		replace: true,
		templateUrl: '/static/components/facebook/fb-menu.html',
		controller: function($scope, fbService, $mdToast){
			$scope.isLoggedIn = fbService.isLoggedIn;
			$scope.login = function(){
				fbService.login(function(){
					console.log(fbService.getUser());
				});
			};
			$scope.logout = function(){
				fbService.logout(function(){
					console.log(fbService.getUser());
				});
			};
			$scope.share = function(){
				fbService.share(function(response){
					if(!angular.isDefined(response.error_code){
						$mdToast.show($mdToast.simple()
							.content('Thanks for spreading the word!')
							.hideDelay(2000));
					}
				});
			};
		}, link: function(scope, element, attrs){

		}
	};
}]);