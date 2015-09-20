var fb = angular.module('facebook', []);

fb.factory('fbService', ['$window', function($window){
	var user = undefined;

	// Initializing Facebook SDK
	$window.fbAsyncInit = function() {
		FB.init({
			appId: '1663895923894184',
			cookie: true,
			xfbml: true,
			version: 'v2.4'
		});
		// FB.getLoginStatus(function(response){
		// 	if(response.status==='connected'){
		// 		user = {
		// 			token: response.authResponse.accessToken,
		// 			id: response.authResponse.userID,
		// 			image: 'http://graph.facebook.com/'+id+'/picture?type=square'
		// 		};
		// 		FB.api('/me', function(response){
		// 			console.log(response);
		// 			user.name = response.name;
		// 		});
		// 	}
		// });
	};
	(function(d, s, id){
		var js, fjs = d.getElementsByTagName(s)[0];
	    if (d.getElementById(id)) {return;}
	    js = d.createElement(s); js.id = id;
	    js.src = "//connect.facebook.net/en_US/sdk.js";
	    fjs.parentNode.insertBefore(js, fjs);
	}(document, 'script', 'facebook-jssdk'));
	
	var isLoggedIn = function(){
		return angular.isDefined(user);
	};
	var login = function(){
		FB.login(function(response){
			if(response && response.status==='connected'){
				user = {
					token: response.authResponse.accessToken,
					id: response.authResponse.userID
				};
				user.image = 'http://graph.facebook.com/'+user.id+'/picture?type=square';
				FB.api('/me', function(response){
					user.name = response.name;
					console.log(user);
				});
			}
		});
	};
	var logout = function(){
		FB.logout(function(){
			user = undefined;
		}, function(response){
			console.log(response);
		});
	};
	var share = function(){
		
	};

	return {
		isLoggedIn: isLoggedIn,
		login: login,
		logout: logout,
		share: share
	};
}]).directive('fbMenu', ['fbService', function(fbService){
	return {
		restrict: 'A',
		replace: true,
		templateUrl: '/static/components/facebook/fb-menu.html',
		controller: function($scope, fbService){
			$scope.isLoggedIn = fbService.isLoggedIn;
			$scope.login = fbService.login;
			$scope.logout = fbService.logout;
			$scope.share = fbService.share();
		}, link: function(scope, element, attrs){

		}
	};
}]);