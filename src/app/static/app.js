var app = angular.module('tldr', ['titleBar', 'sideNav', 'ngRoute']);

app.controller('mainController', ['$scope', '$location', '$timeout', 'feedService', function($scope, $location, $timeout, feedService){
	$scope.page = 'latest';

	$scope.$watch('page', function(newVal, oldVal, scope){
		switch(newVal){
			case 'latest': feedService.articles = $scope.getFeeds(); break;
			default: break;
		}
	});

	// Methods
	$scope.getFeeds = function(){
		return [{
			image: 'http://lorempixel.com/580/250/nature/1',
			title: 'First Article',
			points: [{
				header: 'Point 1',
				content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
			}, {
				header: 'Point 2',
				content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
			}],
			link: 'http://lifehacker.com/'
		}, {
			image: 'http://lorempixel.com/580/250/nature/2',
			title: 'Second Article',
			points: [{
				header: 'Point 1',
				content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
			}, {
				header: 'Point 2',
				content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
			}],
			link: 'http://lifehacker.com/'
		}];
	};

	// Event Handlers
	$scope.$on('pageChange', function(event, newPage){
		$scope.page = newPage;
		console.log($scope.page);
	});
}]).controller('homeController', ['$scope', function($scope){
	$(document).ready(function(){
		$('.slider').slider({
			height: 300
		});
	});
}]).controller('feedController', ['$scope', 'feedService', function($scope, feedService){
	$scope.articles = feedService.articles;
	$scope.$watchCollection('articles', function(newVal, oldVal, scope){
		console.log($scope.articles);
		$('.collapsible').collapsible({accordion: true});
	});
	// $(document).ready(function(){
	// 	$('.collapsible').collapsible({accordion: true});
	// });
	// $('.collapsible').collapsible({accordion: true});
}]).factory('feedService', function(){
	return {
		articles: []
	};
}).config(['$routeProvider', function($routeProvider){
	$routeProvider.when('/', {
		templateUrl: '/static/partials/home.html',
		controller: 'homeController'
	}).when('/about', {
		templateUrl: '/static/partials/about.html'
	}).when('/feed', {
		templateUrl: '/static/partials/feed.html',
		controller: 'feedController'
	}).otherwise({
		redirectTo: '/'
	});
}]);