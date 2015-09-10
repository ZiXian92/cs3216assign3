var app = angular.module('tldr', ['titleBar', 'sideNav', 'ngRoute']);

app.controller('mainController', function($scope){
	
}).controller('homeController', function($scope){
	$(document).ready(function(){
		$('.slider').slider({
			height: 300
		});
	});
}).config(['$routeProvider', function($routeProvider){
	$routeProvider.when('/', {
		templateUrl: '/static/partials/home.html',
		controller: 'homeController'
	}).when('/about', {
		templateUrl: '/static/partials/about.html'
	}).otherwise({
		redirectTo: '/'
	});
}]);