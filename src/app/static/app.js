var app = angular.module('tldr', ['titleBar', 'sideNav', 'ngRoute', 'ngResource', 'ngMdIcons', 'infinite-scroll']);

app.controller('mainController', ['$scope', '$location', 'sidenavService', function($scope, $location, sidenavService){

	// Methods
	$scope.closeMenu = function(){
		sidenavService.closeSidenav();
	};

	$scope.showMenu = function(){
		sidenavService.openSidenav();
	};

	$scope.initCollapsible = function(){
		$('.collapsible').collapsible();
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
}]).controller('feedController', ['$scope', '$location', 'feedService', function($scope, $location, feedService){
	var category = $location.path().split('/')[2];
	category = category ? Number(category) : 0;
	var lastPage = 1;

	/*
	 * @param {Number=} category
	 */
	$scope.getArticles = function(category){
		$scope.isLoading = true;
		if(window.navigator.onLine){
			$scope.articles = feedService.getArticles(category, 0, function(){
				$scope.isLoading = false;
			});
		} else{
			$scope.articles = JSON.parse(window.localStorage.getItem(String(category)));
			$scope.isLoading = false;
		}
	};

	$scope.fetchMoreArticles = function(){
		if($scope.isLoading){
			return;
		}
		$scope.isLoading = true;
		if(window.navigator.onLine){
			var temp = feedService.getArticles(category, lastPage+1, function(){
				lastPage = temp.length===0? lastPage: lastPage+1;
				$scope.isLoading = false;
				if(temp.length>0){
					temp.forEach(function(article){
						$scope.articles.push(article);
					});
				}
			});
		} else{
			console.log('Retrieving from web storage');
			$scope.isLoading = false;
		}
	};

	$scope.$watch('articles', function(){
		window.localStorage.setItem(String(category), JSON.stringify($scope.articles));
	}, true);

	$scope.getArticles(category);
}]).factory('articleService', ['$resource', function($resource){
	return $resource('', {}, {
		getAllArticles: {
			method: 'GET',
			url: '/api/v1/feed/:category?page=:page',
			isArray: true
		},
		getArticleContent: {
			method: 'GET',
			url: '/api/v1/article/:source/:article'
		}
	});
}]).factory('feedService', ['articleService', function(articleService){

	/*
	 * @param {Number} categoryId 0 for all categories
	 * @param {Number} pageNum Starts from 1
	 * @param {function()=} completion
	 */
	var getArticles = function(categoryId, pageNum, completion){
		// console.log(categoryId? true: false); // Prints false when 0
		categoryId = categoryId ? categoryId : 0;
		pageNum = pageNum ? pageNum : 1;
		return articleService.getAllArticles({category: categoryId, page: pageNum}, function(articles){
			completion();
			articles.forEach(function(article){
				articleService.getArticleContent({source: article.source, article: article.article_id}, function(details){
					article.info = details;
				});
			});
		}, function(){
			completion();
		});
	};
	return {
		getArticles: getArticles
	};
}]).directive('postRepeat', function(){
	return function(scope, element, attrs){
		scope.$watch(attrs.postRepeat, function(callback){
			if(scope.$last){
				eval(callback)();
			}
		});
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
	}).when('/feed/:category', {
		templateUrl: '/static/partials/feed.html',
		controller: 'feedController'
	}).otherwise({
		redirectTo: '/'
	});
}]);