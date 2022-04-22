import { createRenderer } from "../runtime-core";
import { isOn } from "../shared";

function createElement(type) {
	console.log("createElement------------");
	return document.createElement(type);
}

/**
 * @param el
 * @param key
 * @param prevVal
 * @param val -> nextVal 当前的值
 */
function patchProp(el, key, prevVal, val) {
	console.log("patchProp------------");
	if (isOn(key)) {
		const eventName = key.slice(2).toLowerCase(); //onClick等，删除 on 变成小写
		el.addEventListener(eventName, val);
	} else {
		if (val === undefined || val === null) {
			el.removeAttribute(key);
		} else {
			el.setAttribute(key, val);
		}
	}
}

function insert(el, parent) {
	console.log("insert------------");
	parent.append(el);
}

function remove(child) {
	const parent = child.parentNode;
	if (parent) {
		parent.removeChild(child);
	}
}
function setElementText(el, text) {
	el.textContent = text;
}

const renderer: any = createRenderer({
	createElement,
	patchProp,
	insert,
	remove,
	setElementText,
});

export function createApp(...args) {
	return renderer.createApp(...args);
}

export * from "../runtime-core";
