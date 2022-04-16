import { isObject, isOn } from "../shared";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { Fragment, Text } from "./vnode";

export function render(vnode, container) {
	// patch
	// console.log("vnode-----", vnode);
	patch(vnode, container);
}

function patch(vnode, container) {
	/**
	 * 区分是 element 还是 component
	 * 判断两种类型
	 */
	// debugger;
	// console.log("patch-------", vnode);

	// 使用 shapeFlag 判断类型
	const { type, shapeFlag } = vnode;

	switch (type) {
		case Fragment:
			processFragment(vnode, container);
			break;

		case Text:
			processText(vnode, container);
			break;

		default:
			// shapeFlag & ShapeFlags.STATEFUL_COMPONENT 等同于 typeof vnode.type === "object"
			if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
				// 处理component
				processComponent(vnode, container);
			} else if (shapeFlag & ShapeFlags.ELEMENT) {
				// 处理 element
				processElement(vnode, container);
			}
			break;
	}
}

// element 类型
function processElement(vnode: any, container: any) {
	mountElement(vnode, container);
}

function mountElement(vnode, container) {
	const { type, children, props } = vnode;

	const el = document.createElement(type);
	// $el
	// vnode -> element -> div
	vnode.el = el;

	// children -> string or array
	// 使用 shapeFlag 判断类型
	const { shapeFlag } = vnode;
	if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
		// children is string
		el.textContent = children;
	} else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
		// children is array
		mountChildren(vnode.children, el); // 抽离-优化
	}

	// props
	for (const key in props) {
		const val = props[key];
		// console.log(key);
		if (isOn(key)) {
			const eventName = key.slice(2).toLowerCase(); //onClick等，删除 on 变成小写
			el.addEventListener(eventName, val);
		} else {
			el.setAttribute(key, val);
		}
	}

	container.append(el);
}

function mountChildren(children: any, el: any) {
	children.forEach((v) => {
		patch(v, el);
	});
}

// component 类型
function processComponent(vnode: any, container: any) {
	mountComponent(vnode, container);
}

function mountComponent(vnode: any, container) {
	// 创建组件实例
	const instance = createComponentInstance(vnode);

	setupComponent(instance);

	setupRenderEffect(instance, container);
}

function setupRenderEffect(instance: any, container) {
	const { proxy } = instance;
	const subTree = instance.render.call(proxy); // 第一次执行App.js根组件中的render函数，这个函数返回由h创建的vnode

	console.log("--subTree", subTree);

	// vnode -> patch
	// vnode -> element -> mountElement
	patch(subTree, container);

	// all element -> mount
	// $el根节点赋值到当前组件vnode的el上面
	instance.vnode.el = subTree.el;
}

// slot 的 Fragment 和 Text
function processFragment(vnode: any, container: any) {
	mountChildren(vnode.children, container);
}
function processText(vnode: any, container: any) {
	const { children } = vnode;
	const textNode = (vnode.el = document.createTextNode(children)); // 需要赋值给vnode的el
	container.append(textNode);
}
