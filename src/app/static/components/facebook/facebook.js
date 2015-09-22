var fb = angular.module('facebook', []);

fb.factory('fbService', ['$window', '$rootScope', function($window, $rootScope){
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
					$window.localStorage.setItem('user', JSON.stringify(user));
				});
			}
		});

		FB.Event.subscribe('auth.logout', function(response){
			user = undefined;
			$window.localStorage.removeItem('user');
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
					$window.localStorage.setItem('user', JSON.stringify(user));
					$rootScope.$apply();
				});
			}
		});
	};

	var initSdk = function(d, s, id){
		var js, fjs = d.getElementsByTagName(s)[0];
	    if (d.getElementById(id)) {return;}
	    js = d.createElement(s); js.id = id;
	    js.src = "//connect.facebook.net/en_US/sdk.js";
	    fjs.parentNode.insertBefore(js, fjs);
	};

	$window.addEventListener('online', function(){
		if(!angular.isDefined(FB)){
			initSdk(document, 'script', 'facebook-jssdk');
		}
	});

	if($window.navigator.onLine){
		initSdk(document, 'script', 'facebook-jssdk');
	} else{
		var temp = JSON.parse($window.localStorage.getItem('user'));
		user = angular.isObject(temp) ? temp : undefined;
	}

	// (function(d, s, id){
	// 	var js, fjs = d.getElementsByTagName(s)[0];
	//     if (d.getElementById(id)) {return;}
	//     js = d.createElement(s); js.id = id;
	//     js.src = "//connect.facebook.net/en_US/sdk.js";
	//     fjs.parentNode.insertBefore(js, fjs);
	// }(document, 'script', 'facebook-jssdk'));
	
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
}]);