import { effect } from "../reactivity/effect";
import { EMPTY_OBJ, isObject, isOn } from "../shared";
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
		patch(null, vnode, container, null); // 处理根组件不传 parentComponent 参数
	}

	// 优化 patch 架构
	// n1 -> 老的，如果不存在则是初始化,存在就是更新逻辑
	// n2 -> 新的
	// function patch(vnode, container, parentComponent) {
	function patch(n1, n2, container, parentComponent) {
		/**
		 * 区分是 element 还是 component
		 * 判断两种类型
		 */
		// debugger;
		// console.log("patch-------", vnode);

		// 使用 shapeFlag 判断类型
		const { type, shapeFlag } = n2;

		switch (type) {
			case Fragment:
				processFragment(n1, n2, container, parentComponent);
				break;

			case Text:
				processText(n1, n2, container);
				break;

			default:
				// shapeFlag & ShapeFlags.STATEFUL_COMPONENT 等同于 typeof vnode.type === "object"
				if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
					// 处理component
					processComponent(n1, n2, container, parentComponent);
				} else if (shapeFlag & ShapeFlags.ELEMENT) {
					// 处理 element
					processElement(n1, n2, container, parentComponent);
				}
				break;
		}
	}

	// element 类型
	function processElement(n1, n2: any, container: any, parentComponent) {
		if (!n1) {
			mountElement(n2, container, parentComponent);
		} else {
			patchElement(n1, n2, container);
		}
	}

	function patchElement(n1, n2, container) {
		console.log("n1", n1);
		console.log("n2", n2);
		console.log("container", container);

		// update props
		const oldProps = n1.props || EMPTY_OBJ;
		const newProps = n2.props || EMPTY_OBJ;
		const el = n1.el;
		n2.el = el; // 本轮n2就是下一轮的n1，不赋值的话 下轮n1中就没有el
		patchProps(el, oldProps, newProps);

		// TODO update children
	}

	function patchProps(el, oldProps, newProps) {
		if (oldProps !== newProps) {
			// 健壮性
			for (const key in newProps) {
				const prevProp = oldProps[key];
				const nextProp = newProps[key];
				if (prevProp !== nextProp) {
					hostPatchProp(el, key, prevProp, nextProp);
				}
			}

			if (oldProps !== EMPTY_OBJ) {
				// 健壮性
				// update props 的第三种情况：属性被删除
				for (const key in oldProps) {
					if (!(key in newProps)) {
						hostPatchProp(el, key, oldProps[key], null);
					}
				}
			}
		}
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
			hostPatchProp(el, key, null, val);
		}

		// 编写 api customRenderer,需要抽离document等web平台的相关函数

		// container.append(el);
		hostInsert(el, container);
	}

	function mountChildren(children: any, el: any, parentComponent) {
		children.forEach((v) => {
			patch(null, v, el, parentComponent);
		});
	}

	// component 类型
	function processComponent(n1, n2: any, container: any, parentComponent) {
		mountComponent(n2, container, parentComponent);
	}

	function mountComponent(vnode: any, container, parentComponent) {
		// 创建组件实例
		const instance = createComponentInstance(vnode, parentComponent);

		setupComponent(instance);

		setupRenderEffect(instance, container);
	}

	function setupRenderEffect(instance: any, container) {
		// 使用effect包裹原来的逻辑，收集依赖
		effect(() => {
			if (!instance.isMounted) {
				// 未挂载就是 init 初始化
				const { proxy } = instance;
				const subTree = instance.render.call(proxy); // 第一次执行App.js根组件中的render函数，这个函数返回由h创建的vnode

				// 保存老的vnode prevSubTree
				instance.subTree = subTree;

				// console.log("--subTree", subTree);

				// vnode -> patch
				// vnode -> element -> mountElement
				patch(null, subTree, container, instance); // parentComponent -> instance

				// all element -> mount
				// $el根节点赋值到当前组件vnode的el上面
				instance.vnode.el = subTree.el;

				// init完成
				instance.isMounted = true;
			} else {
				// update
				const { proxy } = instance;
				const subTree = instance.render.call(proxy);
				const prevSubTree = instance.subTree;
				// 把老的更新，保证下次进入是正确的
				instance.subTree = subTree;

				patch(prevSubTree, subTree, container, instance);
			}
		});
	}

	// slot 的 Fragment 和 Text
	function processFragment(n1, n2: any, container: any, parentComponent) {
		mountChildren(n2.children, container, parentComponent);
	}
	function processText(n1, n2: any, container: any) {
		const { children } = n2;
		const textNode = (n2.el = document.createTextNode(children)); // 需要赋值给vnode的el
		container.append(textNode);
	}

	// 解决 createRenderer之后，createApp 无法再使用 render 的问题
	return {
		createApp: createAppAPI(render),
	};
}
