import { createRenderer } from "../runtime-core";
import { isOn } from "../shared";

function createElement(type) {
	console.log("createElement------------");
	return document.createElement(type);
}

function patchProp(el, key, val) {
	console.log("patchProp------------");
	if (isOn(key)) {
		const eventName = key.slice(2).toLowerCase(); //onClick等，删除 on 变成小写
		el.addEventListener(eventName, val);
	} else {
		el.setAttribute(key, val);
	}
}

function insert(el, parent) {
	console.log("insert------------");
	parent.append(el);
}

const renderer: any = createRenderer({
	createElement,
	patchProp,
	insert,
});

export function createApp(...args) {
	return renderer.createApp(...args);
}

export * from "../runtime-core";
