import { isObject, isOn } from "../shared";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { createAppAPI } from "./createApp";
import { Fragment, Text } from "./vnode";

export function createRenderer(options) {
	const {
		createElement: hostCreateElement,
		patchProp: hostPatchProp,
		insert: hostInsert,
	} = options;

	function render(vnode, container) {
		// patch
		// console.log("vnode-----", vnode);
		patch(vnode, container, null); // 处理根组件不传 parentComponent 参数
	}

	function patch(vnode, container, parentComponent) {
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
				processFragment(vnode, container, parentComponent);
				break;

			case Text:
				processText(vnode, container);
				break;

			default:
				// shapeFlag & ShapeFlags.STATEFUL_COMPONENT 等同于 typeof vnode.type === "object"
				if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
					// 处理component
					processComponent(vnode, container, parentComponent);
				} else if (shapeFlag & ShapeFlags.ELEMENT) {
					// 处理 element
					processElement(vnode, container, parentComponent);
				}
				break;
		}
	}

	// element 类型
	function processElement(vnode: any, container: any, parentComponent) {
		mountElement(vnode, container, parentComponent);
	}

	function mountElement(vnode, container, parentComponent) {
		const { type, children, props } = vnode;

		// 编写 api customRenderer,需要抽离document等web平台的相关函数

		// const el = document.createElement(type);
		const el = hostCreateElement(type);

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
			mountChildren(vnode.children, el, parentComponent); // 抽离-优化
		}

		// props
		for (const key in props) {
			const val = props[key];
			// console.log(key);

			// 编写 api customRenderer,需要抽离document等web平台的相关函数

			// if (isOn(key)) {
			// 	const eventName = key.slice(2).toLowerCase(); //onClick等，删除 on 变成小写
			// 	el.addEventListener(eventName, val);
			// } else {
			// 	el.setAttribute(key, val);
			// }
			hostPatchProp(el, key, val);
		}

		// 编写 api customRenderer,需要抽离document等web平台的相关函数

		// container.append(el);
		hostInsert(el, container);
	}

	function mountChildren(children: any, el: any, parentComponent) {
		children.forEach((v) => {
			patch(v, el, parentComponent);
		});
	}

	// component 类型
	function processComponent(vnode: any, container: any, parentComponent) {
		mountComponent(vnode, container, parentComponent);
	}

	function mountComponent(vnode: any, container, parentComponent) {
		// 创建组件实例
		const instance = createComponentInstance(vnode, parentComponent);

		setupComponent(instance);

		setupRenderEffect(instance, container);
	}

	function setupRenderEffect(instance: any, container) {
		const { proxy } = instance;
		const subTree = instance.render.call(proxy); // 第一次执行App.js根组件中的render函数，这个函数返回由h创建的vnode

		// console.log("--subTree", subTree);

		// vnode -> patch
		// vnode -> element -> mountElement
		patch(subTree, container, instance); // parentComponent -> instance

		// all element -> mount
		// $el根节点赋值到当前组件vnode的el上面
		instance.vnode.el = subTree.el;
	}

	// slot 的 Fragment 和 Text
	function processFragment(vnode: any, container: any, parentComponent) {
		mountChildren(vnode.children, container, parentComponent);
	}
	function processText(vnode: any, container: any) {
		const { children } = vnode;
		const textNode = (vnode.el = document.createTextNode(children)); // 需要赋值给vnode的el
		container.append(textNode);
	}

	// 解决 createRenderer之后，createApp 无法再使用 render 的问题
	return {
		createApp: createAppAPI(render),
	};
}
