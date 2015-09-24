var app = angular.module('tldr', ['titleBar', 'sideNav', 'ngRoute', 'ngResource', 'ngMdIcons', 'infinite-scroll', 'ngMaterial', 'facebook', 'uiModel']);

app.controller('mainController', ['$scope', '$location', '$window', 'sidenavService', 'storageUpdateService', function($scope, $location, $window, sidenavService, storageUpdateService){

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

	// Clears bookmarks when user changes
	$scope.$on($window.localStorage.getItem('user'), function(newVal, oldVal, scope){
		for(var i=0; i<7; i++){
			$window.localStorage.removeItem('bookmark'+i);
		}
	});

	storageUpdateService.update();

}]).controller('feedbackController', ['$scope', '$mdDialog', 'feedbackService', function($scope, $mdDialog, feedbackService) {
	$scope.feedback |= {
		url: '',
		comments: ''
	};
	$scope.submitFeedback = function () {
		feedbackService.submit($scope.feedback, function (response) {
			$scope.feedback = {
				url: '',
				comments: ''
			};
			$mdDialog.show($mdDialog.alert()
				.clickOutsideToClose(true)
				.title('Thank you!')
				.content('Your feedback is noted down.')
				.ok('Ok'));
		}, function (reponse) {
			$mdDialog.show($mdDialog.alert()
				.clickOutsideToClose(true)
				.title('Oops')
				.content('We have some problem saving your feedback.')
				.ok('Ok'));
		});
	}
}]).controller('feedController', ['$scope', '$location', '$mdDialog', '$mdToast', '$route', '$routeParams', 'feedService', 'fbService', 'bookmarkService', 'categoryMapper', 'jobQueue', 'storageService', function($scope, $location, $mdDialog, $mdToast, $route, $routeParams, feedService, fbService, bookmarkService, categoryMapper, jobQueue, storageService){
	var category = $routeParams.category;
	if (category === undefined) {
		category = 0;
	} else if (category !== 'popular') {
		category = Number(category);
	}
	var lastPage = 1;
	$scope.isLastPage = false;

	// var promptReload = function(){
	// 	$mdDialog.show($mdDialog.confirm()
	// 		.title('Refresh content')
	// 		.content('You\'ve come back online. Would you like to get the latest articles?')
	// 		.ok('Yes, please')
	// 		.cancel('Not now')
	// 	).then(function(){
	// 		$route.reload();
	// 	});
	// };

	// Updates article list when app goes back online
	var onOnline = function(){
		// $scope.getArticles(category);
		var temp = feedService.getArticles(category, 1, function(){
			if(angular.isArray(temp) && temp.length>0){
				$scope.articles = temp;
				storageService.setArticlesForCategory(String(category), $scope.articles);
			}
		});
	};

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
		$scope.isLastPage = false;
		$scope.isLoading = true;
		if(window.navigator.onLine){
			$scope.articles = feedService.getArticles(category, 1, function(){
				$scope.isLoading = false;
				storageService.setArticlesForCategory(String(category), $scope.articles);
			});
		} else{
			$scope.articles = storageService.getArticlesForCategory(String(category));
			$scope.isLoading = false;
		}
	};

	$scope.fetchMoreArticles = function(){
		if($scope.isLoading || $scope.isLastPage){
			return;
		}
		$scope.isLoading = true;
		if(window.navigator.onLine){
			var temp = feedService.getArticles(category, lastPage+1, function(){
				lastPage = temp.length===0? lastPage: lastPage+1;
				$scope.isLastPage = temp.length===0;
				temp.forEach(function(article){
					$scope.articles.push(article);
				});
				storageService.setArticlesForCategory(String(category), $scope.articles);
				$scope.isLoading = false;
			});
		} else{
			$scope.isLoading = false;
		}
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
			bookmarkService.removeBookmark(article.source, article.article_id);
		});
	};

	/*
	 * @param {String} url
	 */
	$scope.shareArticle = function(url){
		fbService.share(url);
	};

	window.addEventListener('online', onOnline);
	$scope.$on('$destroy', function(){
		window.removeEventListener('online', onOnline);
	});
	$scope.getArticles(category);
}]).controller('profileController', ['$scope', '$location', '$route', '$mdDialog', 'bookmarkService', 'categoryMapper', 'fbService', 'jobQueue', 'storageService', function($scope, $location, $route, $mdDialog, bookmarkService, categoryMapper, fbService, jobQueue, storageService){
	if(!fbService.isLoggedIn()){
		$location.path('/');
	}

	var lastPage = 1;
	$scope.isLastPage = false;

	var currentCategory = '0';
	$scope.isLoading = false;
	$scope.user = fbService.getUser();

	// Update function triggered when app goes back online
	var onOnline = function(){
		var tempSummary = bookmarkService.getSummary(function(){
			if(angular.isObject(tempSummary) && angular.isArray(tempSummary.keys) && tempSummary.keys.length>0){
				$scope.bookmarkSummary = tempSummary;
				storageService.setBookmarkSummary($scope.bookmarkSummary);
			}
		});

		$scope.getBookmarksForCategory(currentCategory);
		var temp = bookmarkService.getBookmarks(currentCategory, 1, function(){
			if(angular.isArray(temp.data) && temp.data.length>0){
				$scope.articles = temp.data;
				storageService.setBookmarksForCategory(currentCategory, $scope.articles);
			}
		});
	};

	/*
	 * @param {String} category
	 */
	$scope.getBookmarksForCategory = function(category){
		currentCategory = category;
		lastPage = 1;
		$scope.isLastPage = false;
		$scope.isLoading = true;
		if(window.navigator.onLine){
			var temp = bookmarkService.getBookmarks(category, 1, function(){
				$scope.articles = temp.data;
				$scope.isLoading = false;
				storageService.setBookmarksForCategory(category, $scope.articles);
			});
		} else{
			$scope.articles = storageService.getBookmarksForCategory(category);
			$scope.isLoading = false;
		}
	};

	$scope.getCategoryNameForId = categoryMapper.getCategoryNameForId;

	$scope.getMoreBookmarks = function(){
		if(window.navigator.offLine || $scope.isLoading || $scope.isLastPage){
			return;
		}
		$scope.isLoading = true;
		var temp = bookmarkService.getBookmarks(currentCategory, lastPage+1, function(){
			temp.data.forEach(function(article){
				$scope.articles.push(article);
			});
			lastPage = temp.data.length>0 ? lastPage+1 : lastPage;
			$scope.isLastPage = temp.data.length===0;
			storageService.setBookmarksForCategory(currentCategory, $scope.articles);
			$scope.isLoading = false;
		});
	};

	/*
	 * @param {Number} articleIndex
	 */
	$scope.removeBookmark = function(articleIndex){
		var article = $scope.articles[articleIndex];
		$scope.bookmarkSummary.total--;
		$scope.bookmarkSummary.by_categories[categoryMapper.getCategoryId(article.category)]--;
		$scope.articles.splice(articleIndex, 1);
		storageService.setBookmarksForCategory(currentCategory, $scope.articles);
		storageService.setBookmarkSummary($scope.bookmarkSummary);
		jobQueue.addJob(function(){
			bookmarkService.removeBookmark(article.source, article.article_id);
		});
	};

	/*
	 * @param {String} url
	 */
	$scope.shareArticle = function(url){
		fbService.share(url);
	};

	window.addEventListener('online', onOnline);
	$scope.$on('$destroy', function(){
		window.removeEventListener('online', onOnline);
	});
	$scope.bookmarkSummary = (window.navigator.onLine ? bookmarkService.getSummary() : storageService.getBookmarkSummary());
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
}]).factory('feedbackService', ['$resource', function($resource){
	return $resource('/api/v1/feedback', {}, {
		submit: {
			method: 'POST'
		}
	});
}]).factory('bookmarkService', ['bookmarkApiService', 'categoryMapper', function(bookmarkApiService, categoryMapper){

	/*
	 * @param {String} source
	 * @param {String} id
	 * @param {function()=} success
	 * @param {function()=} error
	 */
	var addBookmark = function(source, id, success, error){
		bookmarkApiService.addBookmark({source_id: source, article_id: id}, function(response){
			if(angular.isFunction(success)){
				success();
			}
		}, function(){
			if(angular.isFunction(error)){
				error();
			}
		})
	};

	/*
	 * @param {String} category
	 * @param {Number} page
	 * @param {function()=} success
	 * @param {function()=} error
	 * @return {{data: Array<Object>}}
	 */
	var getBookmarks = function(category, page, success, error){
		return bookmarkApiService.getBookmarks({category: category, page: page}, function(response){
			response.data.forEach(function(article){
				article.categoryUrl = '#/feed/'+categoryMapper.getCategoryId(article.category);
			});
			if(angular.isFunction(success)){
				success();
			}
		}, function(response){
			if(angular.isFunction(error)){
				error();
			}
		});
	};

	/*
	 * @param {function()=} success
	 * @param {function()=} error
	 * @return {{by_categories: Object, total: Number}}
	 */
	var getBookmarksSummary = function(success, error){
		return bookmarkApiService.getSummary({}, function(){
			if(angular.isFunction(success)){
				success();
			}
		}, function(){
			if(angular.isFunction(error)){
				error();
			}
		});
	};

	/*
	 * @param {String} source
	 * @param {String} id
	 * @param {function()=} success
	 * @param {function()=} error
	 */
	var removeBookmark = function(source, id, success, error){
		bookmarkApiService.removeBookmark({source_id: source, article_id: id}, function(response){
			if(angular.isFunction(success)){
				success();
			}
		}, function(){
			if(angular.isFunction(error)){
				error();
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
	 * @param {function()=} success
	 * @param {function()=} error
	 */
	var getArticles = function(categoryId, pageNum, success, error){
		// console.log(categoryId? true: false); // Prints false when 0
		categoryId = categoryId ? categoryId : 0;
		pageNum = pageNum ? pageNum : 1;
		return articleService.getAllArticles({category: categoryId, page: pageNum}, function(articles){
			articles.forEach(function(article){
				article.categoryUrl = '#/feed/'+categoryMapper.getCategoryId(article.category);
			});
			if(angular.isFunction(success)){
				success();
			}
		}, function(){
			if(angular.isFunction(error)){
				error();
			}
		});
	};
	return {
		getArticles: getArticles
	};
}]).factory('storageUpdateService', ['bookmarkService', 'feedService', 'jobQueue', 'storageService', function(bookmarkService, feedService, jobQueue, storageService){
	var categories = ['0', '1', '2', '3', '5', '6', 'popular'];
	var bookmarkCategories = ['0'];

	var update = function(){
		categories.forEach(function(category){
			jobQueue.addJob(function(){
				var articles = feedService.getArticles(category, 1, function(){
					if(!storageService.isUpdatedCategory(category)){
						storageService.setArticlesForCategory(category, articles);
					}
				});
				var bookmarks = bookmarkService.getBookmarks(category, 1, function(){
					if(!storageService.isUpdatedBookmarkCategory(category)){
						storageService.setBookmarksForCategory(category, bookmarks.data);
					}
				});
			});
		});
		jobQueue.addJob(function(){
			var summary = bookmarkService.getSummary(function(){
				storageService.setBookmarkSummary(summary);
			});
		});
	};

	return {
		update: update
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
		templateUrl: '/static/partials/home.html'
	}).when('/about', {
		templateUrl: '/static/partials/about.html'
	}).when('/feedback', {
		templateUrl: '/static/partials/feedback.html',
		controller: 'feedbackController'
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