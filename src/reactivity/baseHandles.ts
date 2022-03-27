import { track, trigger } from "./effect";

const get = createdGetter();
const set = createdSetter();
const readonlyGet = createdGetter(true);

function createdGetter(isReadonly = false) {
	return function get(target, key) {
		const res = Reflect.get(target, key);

		if (!isReadonly) {
			// 依赖收集
			track(target, key);
		}
		return res;
	};
}

function createdSetter() {
	return function set(target, key, value) {
		const res = Reflect.set(target, key, value);

		// 触发依赖
		trigger(target, key);
		return res;
	};
}

export const mutableHanders = {
	get,
	set,
};

export const readonlyHanders = {
	get: readonlyGet,
	set(target, key) {
		console.warn(
			`key :"${String(key)}" set 失败，因为 target 是 readonly 类型`,
			target
		);
		return true;
	},
};
