import { extend } from "../shared";

class reactiveEffect {
	private _fn: any;
	public scheduler: Function | undefined;
	// stop
	deps = [];
	active = true;
	onStop?: () => void;

	constructor(fn, scheduler?: Function) {
		this._fn = fn;
		this.scheduler = scheduler;
	}

	run() {
		activeEffect = this;
		// runner方法需要得到fn的返回值
		return this._fn();
	}

	stop() {
		if (this.active) {
			cleanupEffect(this);
			// stop时 调用onStop方法
			if (this.onStop) {
				this.onStop();
			}
			this.active = false;
		}
	}
}

function cleanupEffect(effect) {
	effect.deps.forEach((dep: any) => {
		dep.delete(effect);
	});
}

const targetMap = new Map();
export function track(target, key) {
	// target -> key -> dep
	// targetMap -> { target: depsMap }
	// depsMap -> {key: dep}
	// dep -> activeEffect

	let depsMap = targetMap.get(target);
	if (!depsMap) {
		depsMap = new Map();
		targetMap.set(target, depsMap);
	}

	let dep = depsMap.get(key);
	if (!dep) {
		dep = new Set();
		depsMap.set(key, dep);
	}

	dep.add(activeEffect);
	// track的时候收集dep，stop会用到
	if (!activeEffect) return; //解决只用reactive时，deps undefined的情况
	activeEffect.deps.push(dep);
}

export function trigger(target, key) {
	const depsMap = targetMap.get(target);
	const dep = depsMap.get(key);
	for (const effect of dep) {
		if (effect.scheduler) {
			effect.scheduler();
		} else {
			effect.run();
		}
	}
}

let activeEffect;
export function effect(fn, options: any = {}) {
	const _effect = new reactiveEffect(fn, options.scheduler);

	_effect.run();

	// _effect.onStop = options.onStop; // 抽离-优化
	extend(_effect, options);

	// 返回的 runner函数
	// run方法用到了this,使用bind处理指针问题
	const runner: any = _effect.run.bind(_effect);
	// stop 要用到 _effect上面的方法
	runner.effect = _effect;
	return runner;
}

export function stop(runner) {
	runner.effect.stop();
}
