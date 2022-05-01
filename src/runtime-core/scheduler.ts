const queue: any[] = [];
let isFlushPending = false; // 优化每次都会创建promise的问题

export function queueJobs(job) {
	if (!queue.includes(job)) {
		queue.push(job);
	}

	queueFlush();
}

export function nextTick(fn) {
	return fn ? Promise.resolve().then(fn) : Promise.resolve();
}

function queueFlush() {
	if (isFlushPending) return;
	isFlushPending = true;
	Promise.resolve().then(() => {
		isFlushPending = false;
		let job;
		while ((job = queue.shift())) {
			job && job();
		}
	});
}
