import { hasChanged, isObject } from "../shared";
import { effectTracks, effectTriggers, isTracking } from "./effect";
import { reactive } from "./reactive";

// {} -> value -> get set
class RefImpl {
	private _value: any;
	public dep: any;
	private _rawValue: any; // 备份原始值
	public __v_isRef = true;
	constructor(value) {
		this._rawValue = value;
		this._value = convert(value);
		// value 是对象的话需要转换成 reactive
		this.dep = new Set();
	}
	get value() {
		// 只用到 get value时，track里面的activeEffect.deps 为undefined，解决这个问题
		trackRefValue(this);
		return this._value;
	}
	set value(newValue) {
		// 新旧值不改变，就不执行
		// 使用_rawValue，因为这个值是没有被reactive处理过的，是一个普通obj
		// 如果传入的是对象，_value就是被处理过的 proxy对象，hasChanged只能传入普通对象做比较
		if (hasChanged(newValue, this._rawValue)) {
			// 要先修改value，再触发依赖
			this._rawValue = newValue;
			this._value = convert(newValue);
			effectTriggers(this.dep);
		}
	}
}

function trackRefValue(ref) {
	if (isTracking()) {
		effectTracks(ref.dep);
	}
}

// 如果传入 ref 的是一个对象，内部也会调用 reactive 方法进行深层响应转换
function convert(value) {
	return isObject(value) ? reactive(value) : value;
}

export function ref(value) {
	return new RefImpl(value);
}

export function isRef(ref) {
	// 如果传入数值 1 这种参数，ref.__v_isRef会是undefined，所以用!!转换成Boolean
	return !!ref.__v_isRef;
}

export function unRef(ref) {
	return isRef(ref) ? ref.value : ref;
}

export function proxyRefs(objectWithRefs) {
	return new Proxy(objectWithRefs, {
		get(target, key) {
			return unRef(Reflect.get(target, key));
		},
		set(target, key, value) {
			if (isRef(target[key]) && !isRef(value)) {
				return (target[key].value = value);
			} else {
				return Reflect.set(target, key, value);
			}
		},
	});
}
