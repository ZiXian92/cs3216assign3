var module = angular.module('uiModel', []);

module.factory('jobQueue', function(){
	var q1 = [];
	var q2 = [];
	var interval = 500;	// Number of milliseconds between execution of consecutive jobs
	var timer = undefined;
	var isRunning = false;

	/*
	 * @param {function()} job
	 */
	var enqueueJob = function(job){
		q1.push(job);
	};

	/*
	 * @return {function()?} The next job to process in the queue or undefined if queue is empty.
	 */
	var dequeueJob = function(){
		if(q2.length===0){
			while(q1.length>0){
				q2.push(q1.pop());
			}
		}
		return q2.pop();
	};

	var halt = function(){
		console.log('Halting jobs');
		if(angular.isNumber(timer)){
			clearInterval(timer);
			timer = undefined;
		}
	};

	var processJobs = function(){
		console.log('Resuming jobs');
		timer = setInterval(function(){
			var job = dequeueJob();
			if(angular.isFunction(job)){
				job();
			}
		}, interval);
		isRunning = true;
	};

	window.addEventListener('offline', halt);
	window.addEventListener('online', processJobs);

	if(window.navigator.onLine && !isRunning){
		console.log('Starting jobs');
		processJobs();
	}

	return {
		addJob: enqueueJob
	};
});