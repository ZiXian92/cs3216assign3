var app = angular.module('tldr', ['titleBar', 'sideNav', 'ngRoute', 'ngResource', 'ngMdIcons', 'infinite-scroll', 'ngMaterial', 'facebook', 'uiModel']);

app.controller('mainController', ['$scope', '$location', 'sidenavService', 'jobQueue', function($scope, $location, sidenavService, jobQueue){

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
}]).controller('feedController', ['$scope', '$location', '$mdDialog', '$mdToast', '$routeParams', 'feedService', 'fbService', 'bookmarkService', 'categoryMapper', 'jobQueue', function($scope, $location, $mdDialog, $mdToast, $routeParams, feedService, fbService, bookmarkService, categoryMapper, jobQueue){
	var category = $routeParams.category;
	if (category === undefined) {
		category = 0;
	} else if (category !== 'popular') {
		category = Number(category);
	}
	var lastPage = 1;
	var isLastPage = false;

	/*
	 * @param {Object) article
	 */
	$scope.bookmarkArticle = function(article){
		article.bookmarked = true;
		article.bookmarks += 1;
		jobQueue.addJob(function(){
			bookmarkService.addBookmark(article.source, article.article_id);
		});
	};

	/*
	 * @param {Number=} category
	 */
	$scope.getArticles = function(category){
		isLastPage = false;
		$scope.isLoading = true;
		if(window.navigator.onLine){
			$scope.articles = feedService.getArticles(category, 1, function(){
				$scope.isLoading = false;
				window.localStorage.setItem(String(category), JSON.stringify($scope.articles));
			});
		} else{
			$scope.articles = JSON.parse(window.localStorage.getItem(String(category)));
			$scope.isLoading = false;
		}
	};

	$scope.fetchMoreArticles = function(){
		if($scope.isLoading || isLastPage){
			return;
		}
		$scope.isLoading = true;
		if(window.navigator.onLine){
			var temp = feedService.getArticles(category, lastPage+1, function(){
				lastPage = temp.length===0? lastPage: lastPage+1;
				isLastPage = temp.length===0;
				$scope.isLoading = false;
				temp.forEach(function(article){
					$scope.articles.push(article);
				});
				window.localStorage.setItem(String(category), JSON.stringify($scope.articles));
			});
		} else{
			$scope.isLoading = false;
		}
	};

	/*
	 * @param {Number} articleCategory
	 */
	$scope.getUrlForCategory = function(articleCategory){
		return '#/feed/' + categoryMapper.getCategoryId(articleCategory);
	};

	/*
	 * @param {Object} article
	 */
	$scope.onClickBookmarkForArticle = function(article){
		if(!fbService.isLoggedIn()){
			$mdDialog.show($mdDialog.alert()
				.clickOutsideToClose(true)
				.title('Not allowed')
				.content('You need to be logged in to do that.')
				.ok('Ok'));
			return;
		}
		if(!article.bookmarked){
			$scope.bookmarkArticle(article);
		} else{
			$scope.removeBookmark(article);
		}
	};

	/*
	 * @param {Object} article
	 */
	$scope.removeBookmark = function(article){
		article.bookmarked = false;
		article.bookmarks -= 1;
		jobQueue.addJob(function(){
			bookmarkService.removeBookmark({
				'article_id': article.article_id,
				'source_id': article.source
			});
		});
	};

	/*
	 * @param {String} url
	 */
	$scope.shareArticle = function(url){
		fbService.share(url, function(){

		});
	};

	$scope.getArticles(category);
}]).controller('profileController', ['$scope', '$location', 'bookmarkService', 'categoryMapper', 'fbService', 'jobQueue', function($scope, $location, bookmarkService, categoryMapper, fbService, jobQueue){
	if(!fbService.isLoggedIn()){
		$location.path('/');
	}

	var lastPage = 1;
	var isLastPage = false;

	var currentCategory = '0';
	$scope.isLoading = false;
	$scope.user = fbService.getUser();

	/*
	 * @param {String} category
	 */
	$scope.getBookmarksForCategory = function(category){
		currentCategory = category;
		lastPage = 1;
		isLastPage = false;
		$scope.isLoading = true;
		var temp = bookmarkService.getBookmarks(category, 1, function(){
			$scope.articles = temp.data;
			$scope.isLoading = false;
		});
	};

	$scope.getCategoryNameForId = categoryMapper.getCategoryNameForId;

	$scope.getMoreBookmarks = function(){
		if($scope.isLoading || isLastPage){
			return;
		}
		$scope.isLoading = true;
		var temp = bookmarkService.getBookmarks(currentCategory, lastPage+1, function(){
			temp.data.forEach(function(article){
				$scope.articles.push(article);
			});
			lastPage = temp.data.length>0 ? lastPage+1 : lastPage;
			isLastPage = temp.data.length===0;
			$scope.isLoading = false;
		});
	};

	/*
	 * @param {Number} articleIndex
	 */
	$scope.removeBookmark = function(articleIndex){
		var article = $scope.articles[articleIndex];
		bookmarkService.removeBookmark(article.source, article.article_id, function(){
			$scope.bookmarkSummary.total--;
			$scope.bookmarkSummary.by_categories[categoryMapper.getCategoryId(article.category)]--;
			$scope.articles.splice(articleIndex, 1);
			// $scope.bookmarkSummary = bookmarkService.getSummary();
		});
	};

	/*
	 * @param {String} url
	 */
	$scope.shareArticle = function(url){
		fbService.share(url, function(){

		});
	};

	$scope.bookmarkSummary = bookmarkService.getSummary();
	$scope.getBookmarksForCategory(currentCategory);

}]).factory('articleService', ['$resource', function($resource){
	return $resource('', {}, {
		getAllArticles: {
			method: 'GET',
			url: '/api/v1/feed/:category?page=:page',
			isArray: true
		}
	});
}]).factory('bookmarkApiService', ['$resource', function($resource){
	return $resource('/api/v1/bookmark', {}, {
		addBookmark: {
			method: 'POST'
		},
		getBookmarks: {
			method: 'GET',
			isArray: false
		},
		getSummary: {
			method: 'GET',
			url: 'api/v1/bookmark_count'
		},
		removeBookmark: {
			method: 'DELETE'
		}
	});
}]).factory('bookmarkService', ['bookmarkApiService', 'categoryMapper', function(bookmarkApiService, categoryMapper){

	/*
	 * @param {String} source
	 * @param {String} id
	 * @param {function()=} completion
	 */
	var addBookmark = function(source, id, completion){
		bookmarkApiService.addBookmark({source_id: source, article_id: id}, function(response){
			if(angular.isFunction(completion)){
				completion();
			}
		}, function(){
			if(angular.isFunction(completion)){
				completion();
			}
		})
	};

	/*
	 * @param {String} category
	 * @param {Number} page
	 * @param {function()=} completion
	 * @return {{data: Array<Object>}}
	 */
	var getBookmarks = function(category, page, completion){
		return bookmarkApiService.getBookmarks({category: category, page: page}, function(response){
			response.data.forEach(function(article){
				article.categoryUrl = '#/feed/'+categoryMapper.getCategoryId(article.category);
			});
			if(angular.isFunction(completion)){
				completion();
			}
		}, function(response){
			if(angular.isFunction(completion)){
				completion();
			}
		});
	};

	/*
	 * @return {{by_categories: Object, total: Number}}
	 */
	var getBookmarksSummary = function(){
		return bookmarkApiService.getSummary();
	};

	/*
	 * @param {String} source
	 * @param {String} id
	 * @param {function()=} completion
	 */
	var removeBookmark = function(source, id, completion){
		bookmarkApiService.removeBookmark({source_id: source, article_id: id}, function(response){
			if(angular.isFunction(completion)){
				completion();
			}
		}, function(){
			if(angular.isFunction(completion)){
				completion();
			}
		});
	};

	return {
		addBookmark: addBookmark,
		getBookmarks: getBookmarks,
		getSummary: getBookmarksSummary,
		removeBookmark: removeBookmark
	};
}]).factory('categoryMapper', function(){
	return {
		getCategoryId: function(category){
			switch(category){
				case 'Self-help': return '1';
				case 'Money': return '2';
				case 'Technology': return '3';
				case 'Work': return '4';
				case 'Lifestyle': return '5';
				case 'Others': return '6';
				default: return '0';
			}
		},
		getCategoryNameForId: function(categoryId){
			categoryId = Number(categoryId);
			switch(categoryId){
				case 0: return 'All';
				case 1: return 'Self-help';
				case 2: return 'Money';
				case 3: return 'Tech';
				case 5: return 'Lifestyle';
				case 6: return 'Others';
				default: return undefined;
			}
		}
	};
}).factory('feedService', ['articleService', 'categoryMapper', function(articleService, categoryMapper){

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
			articles.forEach(function(article){
				article.categoryUrl = '#/feed/'+categoryMapper.getCategoryId(article.category);
			});
			if(angular.isFunction(completion)){
				completion();
			}
		}, function(){
			if(angular.isFunction(completion)){
				completion();
			}
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