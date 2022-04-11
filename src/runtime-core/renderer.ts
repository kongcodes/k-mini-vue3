import { isObject, isOn } from "../shared";
import { createComponentInstance, setupComponent } from "./component";

export function render(vnode, container) {
	// patch
	console.log("vnode-----", vnode);
	patch(vnode, container);
}

function patch(vnode, container) {
	/**
	 * 区分是 element 还是 component
	 * 判断两种类型
	 */
	// debugger;
	console.log("patch-------", vnode);

	if (isObject(vnode.type)) {
		// 去处理组件
		processComponent(vnode, container);
	} else if (typeof vnode.type === "string") {
		processElement(vnode, container);
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
	if (typeof children === "string") {
		// children is string
		el.textContent = children;
	} else if (Array.isArray(children)) {
		// children is array
		mountChildren(vnode.children, el); // 抽离-优化
	}

	// props
	for (const key in props) {
		const val = props[key];
		console.log(key);
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
	const subTree = instance.render.call(proxy);

	// vnode -> patch
	// vnode -> element -> mountElement
	patch(subTree, container);

	// all element -> mount
	// $el根节点赋值到当前组件vnode的el上面
	instance.vnode.el = subTree.el;
}
