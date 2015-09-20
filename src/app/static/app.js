var app = angular.module('tldr', ['titleBar', 'sideNav', 'ngRoute', 'ngResource', 'ngMdIcons', 'infinite-scroll', 'ngMaterial']);

app.controller('mainController', ['$scope', '$location', 'sidenavService', function($scope, $location, sidenavService){

	// Methods
	$scope.closeMenu = sidenavService.closeSidenav;

	$scope.showMenu = sidenavService.openSidenav;

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
}]).controller('feedController', ['$scope', '$location', '$mdToast', 'feedService', 'bookmarkService', 'categoryMapper', function($scope, $location, $mdToast, feedService, bookmarkService, categoryMapper){
	var category = $location.path().split('/')[2];
	category = category ? Number(category) : 0;
	var lastPage = 1;

	/*
	 * @param {Object) article
	 */
	$scope.bookmarkArticle = function(article){
		bookmarkService.addBookmark({}, {
			'article_id': article.article_id,
			'source_id': article.source
		}, function(){
			article.bookmerked = true;
		}, function(response){
			if(response.status===403){
				$mdToast.show($mdToast.simple()
					.content('Please log in and try again')
					.position('right')
					.hideDelay(2000));
			} else if(response.status===409){
				$mdToast.show($mdToast.simple()
					.content('Already bookmarked')
					.position('right')
					.hideDelay(2000));
			}
		});
	};

	/*
	 * @param {Number=} category
	 */
	$scope.getArticles = function(category){
		$scope.isLoading = true;
		if(window.navigator.onLine){
			$scope.articles = feedService.getArticles(category, 1, function(){
				$scope.isLoading = false;
				$scope.articles.forEach(function(article){
					article.categoryUrl = $scope.getUrlForCategory(article.category);
				});
				window.localStorage.setItem(String(category), JSON.stringify($scope.articles));
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
						article.categoryUrl = $scope.getUrlForCategory(article.category);
						$scope.articles.push(article);
					});
					window.localStorage.setItem(String(category), JSON.stringify($scope.articles));
				}
			});
		} else{
			$scope.isLoading = false;
		}
	};

	$scope.getUrlForCategory = function(articleCategory){
		return '#/feed/' + categoryMapper.getCategoryId(articleCategory);
	};

	// $scope.$watch('articles', function(){
	// 	window.localStorage.setItem(String(category), JSON.stringify($scope.articles));
	// }, true);

	$scope.getArticles(category);
}]).controller('profileController', ['$scope', '$location', 'fbService', function($scope, $location, fbService){
	if(!fbService.isLoggedIn()){
		$location.path('/');
	}

	$scope.user = fbService.getUser();
}]).factory('articleService', ['$resource', function($resource){
	return $resource('', {}, {
		getAllArticles: {
			method: 'GET',
			url: '/api/v1/feed/:category?page=:page',
			isArray: true
		}
	});
}]).factory('bookmarkService', ['$resource', function($resource){
	return $resource('/api/v1/bookmark', {}, {
		addBookmark: {
			method: 'POST'
		},
		getBookmarks: {
			method: 'GET',
			isArray: true
		},
		removeBookmark: {
			method: 'DELETE'
		}
	});
}]).factory('categoryMapper', function(){
	return {
		getCategoryId: function(category){
			console.log(category);
			switch(category){
				case 'Self-help': return '1';
				case 'Money': return '2';
				case 'Technology': return '3';
				case 'Work': return '4';
				case 'Lifestyle': return '5';
				case 'Others': return '6';
				default: return '0';
			}
		}
	};
}).factory('feedService', ['articleService', function(articleService){

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
	}).when('/profile', {
		templateUrl: '/static/partials/profile.html',
		controller: 'profileController'
	}).otherwise({
		redirectTo: '/'
	});
}]);