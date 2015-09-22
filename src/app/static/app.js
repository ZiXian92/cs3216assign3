var app = angular.module('tldr', ['titleBar', 'sideNav', 'ngRoute', 'ngResource', 'ngMdIcons', 'infinite-scroll', 'ngMaterial', 'uiModel']);

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
}]).controller('feedController', ['$scope', '$location', '$mdDialog', '$mdToast', 'feedService', 'fbService', 'bookmarkService', 'categoryMapper', 'jobQueue', function($scope, $location, $mdDialog, $mdToast, feedService, fbService, bookmarkService, categoryMapper, jobQueue){
	var category = $location.path().split('/')[2];
	category = category ? Number(category) : 0;
	var lastPage = 1;
	var isLastPage = false;

	/*
	 * @param {Object) article
	 */
	$scope.bookmarkArticle = function(article){
		bookmarkService.addBookmark({}, {
			'article_id': article.article_id,
			'source_id': article.source
		}, function(){
			article.bookmarked = true;
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
		isLastPage = false;
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
		if($scope.isLoading || isLastPage){
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
				} else{
					isLastPage = true;
				}
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
				.content('Please log in to bookmark this article.')
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
		bookmarkService.removeBookmark({
			'article_id': article.article_id,
			'source_id': article.source
		}, function(response){
			article.bookmarked = false;
		});
	};

	/*
	 * @param {String} url
	 */
	$scope.shareArticle = function(url){
		fbService.share(url, function(){

		});
	};

	// $scope.$watch('articles', function(){
	// 	window.localStorage.setItem(String(category), JSON.stringify($scope.articles));
	// }, true);

	$scope.getArticles(category);
}]).controller('profileController', ['$scope', '$location', 'bookmarkService', 'categoryMapper', 'fbService', function($scope, $location, bookmarkService, categoryMapper, fbService){
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
		bookmarkService.getBookmarks({category: category}, function(response){
			$scope.articles = response.data;
			$scope.articles.forEach(function(article){
				article.categoryUrl = $scope.getUrlForCategory(article.category);
			});
			$scope.isLoading = false;
		});
	};

	$scope.getCategoryNameForId = categoryMapper.getCategoryNameForId;

	$scope.getMoreBookmarks = function(){
		if($scope.isLoading || isLastPage){
			return;
		}
		$scope.isLoading = true;
		bookmarkService.getBookmarks({category: currentCategory, page: lastPage+1}, function(response){
			var temp = response.data;
			lastPage = temp.length>0 ? lastPage+1 : lastPage;
			$scope.isLoading = false;
			if(temp.length>0){
				temp.forEach(function(article){
					article.categoryUrl = $scope.getUrlForCategory(article.category);
					$scope.articles.push(article);
				});
			} else{
				isLastPage = true;
			}
		});
	};

	/*
	 * @param {String} articleCategory
	 * @return {String} URL for the category's feed page
	 */
	$scope.getUrlForCategory = function(articleCategory){
		return '#/feed/'+categoryMapper.getCategoryId(articleCategory);
	};

	/*
	 * @param {Number} articleIndex
	 */
	$scope.removeBookmark = function(articleIndex){
		var article = $scope.articles[articleIndex];
		bookmarkService.removeBookmark({
			'article_id': article.article_id,
			'source_id': article.source
		}, function(response){
			$scope.articles.splice(articleIndex, 1);
		});
	};

	/*
	 * @param {String} url
	 */
	$scope.shareArticle = function(url){
		fbService.share(url, function(){

		});
	};

	$scope.bookmarkSummary = bookmarkService.getSummary({}, function(response){
		console.log(response);
	});
	$scope.getBookmarksForCategory(currentCategory);
	
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