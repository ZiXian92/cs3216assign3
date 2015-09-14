var app = angular.module('tldr', ['titleBar', 'sideNav', 'ngRoute', 'ngResource']);

app.controller('mainController', ['$scope', '$location', '$timeout', 'articleService', 'feedService', function($scope, $location, $timeout, articleService, feedService){

	$scope.$watch('page', function(newVal, oldVal, scope){
		switch(newVal){
			//case 'latest': $scope.getArticles(0); break;
			default: break;
		}
	});

	console.log($location.path());
	switch($location.path()){
		case '/': case '/feed': $scope.page = 'latest'; break;
		default: break;
	}

	// Methods
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
}]).controller('feedController', ['$scope', 'feedService', function($scope, feedService){
	$scope.articles = feedService.articles;
	feedService.getArticles();
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
	var articleList = [];
	var getArticles = function(categoryId, pageNum){
		// console.log(categoryId? true: false); // Prints false when 0
		categoryId = categoryId ? categoryId : 0;
		pageNum = pageNum ? pageNum : 1;
		articleService.getAllArticles({category: categoryId, page: pageNum}).$promise.then(function(articles){
			articles.forEach(function(article){
                articleList.push(article);
				articleService.getArticleContent({source: article.source, article: article.article_id}).$promise.then(function(info){
					info.bullets = info.bullets.filter(function(bullet){
						if(bullet.title!==''){
							bullet.details = bullet.details.filter(function(para){
								return para!=='';
							});
							return true;
						}
						return false;
					});
					article.info = info;
				});
			});
		});
	};
	return {
		articles: articleList,
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
	}).otherwise({
		redirectTo: '/'
	});
}]);