import { getCurrentInstance } from "./component";

export function provide(key, value) {
	// 存
	const currentInstance: any = getCurrentInstance();
	if (currentInstance) {
		let { provides } = currentInstance;
		const parentProvides = currentInstance.parent.provides;
		// 判断是初始化的时候才执行
		if (provides === parentProvides) {
			// 给 provides 指定原型链对象为 父级
			provides = currentInstance.provides = Object.create(parentProvides);
		}
		provides[key] = value;
	}
}

export function inject(key, defaultValue) {
	// 取
	const currentInstance: any = getCurrentInstance();
	if (currentInstance) {
		const parentProvides = currentInstance.parent.provides;
		if (key in parentProvides) {
			return parentProvides[key];
		} else if (defaultValue) {
			// 处理默认值  可能是字符串或函数
			if (typeof defaultValue === "function") {
				return defaultValue();
			}
			return defaultValue;
		}
	}
}
