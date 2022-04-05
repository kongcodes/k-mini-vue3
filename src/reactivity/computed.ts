import { reactiveEffect } from "./effect";

class ComputedRefImpl {
	private _getter: any;
	private _dirty: boolean = true;
	private _value: any;
	private _effect: reactiveEffect;
	constructor(getter) {
		this._getter = getter;
		// effect & scheduler
		this._effect = new reactiveEffect(getter, () => {
			if (!this._dirty) {
				// 当依赖的响应式对象的值发生改变的时候 需要 _dirty = true，才能返回一个新的值
				this._dirty = true;
			}
		});
	}

	get value() {
		// get
		if (this._dirty) {
			// 怎么知道变化了，需要使用effect
			this._dirty = false;
			this._value = this._effect.run();
		}
		return this._value;
	}
}

export function computed(getter) {
	return new ComputedRefImpl(getter);
}
