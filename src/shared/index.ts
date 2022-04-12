export const extend = Object.assign;

export function isObject(val) {
	return val !== null && typeof val === "object";
}

export const hasChanged = (value, newValue) => {
	return !Object.is(value, newValue);
};

// 事件注册
export const isOn = (key) => /^on[A-Z]/.test(key);

// props
export const hasOwn = (val, key) =>
	Object.prototype.hasOwnProperty.call(val, key);
