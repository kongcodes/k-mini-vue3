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

// emit
// 首字母大写 前面加on
// add -> onAdd
const capitalize = (str: string) => {
	return str.charAt(0).toUpperCase() + str.slice(1);
};

// kebab-case foo-add -> fooAdd
export const camelize = (str: string) => {
	return str.replace(/-(\w)/g, (_, c: string) => {
		return c ? c.toUpperCase() : "";
	});
};

export const toHandlerKey = (str: string) => {
	return str ? "on" + capitalize(str) : "";
};
