var module = angular.module('uiModel', []);

module.factory('jobQueue', function () {
	var q1 = [];
	var q2 = [];
	var interval = 100;	// Number of milliseconds between execution of consecutive jobs
	var timer = undefined;
	var isRunning = false;

	/*
	 * @param {function()} job
	 */
	var enqueueJob = function (job) {
		q1.push(job);
	};

	/*
	 * @return {function()?} The next job to process in the queue or undefined if queue is empty.
	 */
	var dequeueJob = function () {
		if (q2.length === 0) {
			while (q1.length > 0) {
				q2.push(q1.pop());
			}
		}
		return q2.pop();
	};

	var halt = function () {
		console.log('Halting jobs');
		if (angular.isNumber(timer)) {
			clearInterval(timer);
			timer = undefined;
		}
	};

	var processJobs = function () {
		console.log('Resuming jobs');
		timer = setInterval(function () {
			var job = dequeueJob();
			if (angular.isFunction(job)) {
				job();
			}
		}, interval);
		isRunning = true;
	};

	window.addEventListener('offline', halt);
	window.addEventListener('online', processJobs);

	if (window.navigator.onLine && !isRunning) {
		console.log('Starting jobs');
		processJobs();
	}

	return {
		addJob: enqueueJob
	};
}).factory('storageService', ['$window', function ($window) {

	var updated = {
		'0': false,
		'1': false,
		'2': false,
		'3': false,
		'4': false,
		'5': false,
		'6': false,
		'popular': false,
		'bookmark0': false,
		'bookmark1': false,
		'bookmark2': false,
		'bookmark3': false,
		'bookmark4': false,
		'bookmark5': false,
		'bookmark6': false
	};

	var clearUser = function () {
		$window.localStorage.removeItem('user');
		for (var i = 0; i < 7; i++) {
			$window.localStorage.removeItem('bookmark' + String(i));
		}
	};

	/*
	 * @param {String} category
	 * @return {Object?}
	 */
	var getArticlesForCategory = function (category) {
		return JSON.parse($window.localStorage.getItem(category));
	};

	/*
	 * @param {String} category
	 * @return {Object?}
	 */
	var getBookmarksForCategory = function (category) {
		return JSON.parse($window.localStorage.getItem('bookmark' + category));
	};

	/*
	 * @return {Object?}
	 */
	var getBookmarkSummary = function () {
		return JSON.parse($window.localStorage.getItem('bookmarkSummary'));
	};

	/*
	 * @return {Object?}
	 */
	var getUser = function () {
		return JSON.parse($window.localStorage.getItem('user'));
	};

	/*
	 * @param {String} category
	 */
	var isUpdatedBookmarkCategory = function (category) {
		return updated['bookmark' + category];
	};

	/*
	 * @param {String} category
	 */
	var isUpdatedCategory = function (category) {
		return updated[category];
	};

	/*
	 * @param {String} category
	 * @param {Array<Object>} articles
	 */
	var setArticlesForCategory = function (category, articles) {
		$window.localStorage.setItem(category, JSON.stringify(articles));
		updated[category] = true;
	};

	/*
	 * @param {String} category
	 * @param {Array<Object>} bookmarks
	 */
	var setBookmarksForCategory = function (category, bookmarks) {
		$window.localStorage.setItem('bookmark' + category, JSON.stringify(bookmarks));
		updated['bookmark+category'] = true;
	};

	/*
	 * @param {Object} summary*/
	var setBookmarkSummary = function (summary) {
		$window.localStorage.setItem('bookmarkSummary', JSON.stringify(summary));
	};

	/*
	 * @param {{
					id: String,
					image: String,
					name: String,
					token: String
				}} user
	 */
	var setUser = function (user) {
		$window.localStorage.setItem('user', JSON.stringify(user));
	};

	return {
		clearUser: clearUser,
		getArticlesForCategory: getArticlesForCategory,
		getBookmarksForCategory: getBookmarksForCategory,
		getBookmarkSummary: getBookmarkSummary,
		getUser: getUser,
		isUpdatedBookmarkCategory: isUpdatedBookmarkCategory,
		isUpdatedCategory: isUpdatedCategory,
		setArticlesForCategory: setArticlesForCategory,
		setBookmarksForCategory: setBookmarksForCategory,
		setBookmarkSummary: setBookmarkSummary,
		setUser: setUser
	};
}]);