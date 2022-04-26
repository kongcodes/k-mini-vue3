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
		remove: hostRemove,
		setElementText: hostSetElementText,
	} = options;

	function render(vnode, container) {
		// patch
		// console.log("vnode-----", vnode);
		patch(null, vnode, container, null, null); // 处理根组件不传 parentComponent 参数
	}

	// 优化 patch 架构
	// n1 -> 老的，如果不存在则是初始化,存在就是更新逻辑
	// n2 -> 新的
	// function patch(vnode, container, parentComponent) {
	function patch(n1, n2, container, parentComponent, anchor) {
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
				processFragment(n1, n2, container, parentComponent, anchor);
				break;

			case Text:
				processText(n1, n2, container);
				break;

			default:
				// shapeFlag & ShapeFlags.STATEFUL_COMPONENT 等同于 typeof vnode.type === "object"
				if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
					// 处理component
					processComponent(n1, n2, container, parentComponent, anchor);
				} else if (shapeFlag & ShapeFlags.ELEMENT) {
					// 处理 element
					processElement(n1, n2, container, parentComponent, anchor);
				}
				break;
		}
	}

	// element 类型
	function processElement(n1, n2: any, container: any, parentComponent, anchor) {
		if (!n1) {
			mountElement(n2, container, parentComponent, anchor);
		} else {
			patchElement(n1, n2, container, parentComponent, anchor);
		}
	}

	function patchElement(n1, n2, container, parentComponent, anchor) {
		console.log("n1", n1);
		console.log("n2", n2);
		console.log("container", container);

		// update props
		const oldProps = n1.props || EMPTY_OBJ;
		const newProps = n2.props || EMPTY_OBJ;
		const el = n1.el;
		n2.el = el; // 本轮n2就是下一轮的n1，不赋值的话 下轮n1中就没有el

		patchChildren(n1, n2, el, parentComponent, anchor);
		patchProps(el, oldProps, newProps);
	}

	function patchChildren(n1, n2, container, parentComponent, anchor) {
		const prevShapeFlag = n1.shapeFlag;
		const nextShapeFlag = n2.shapeFlag;
		const c1 = n1.children;
		const c2 = n2.children;

		if (nextShapeFlag & ShapeFlags.TEXT_CHILDREN) {
			// TODO 优化
			if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
				// array -> text
				// 1. 把老的清空
				unmountChildren(n1.children);
				// 2. 设置text
				hostSetElementText(container, c2);
			} else {
				// text -> text
				// 前后节点不一样才需要改变
				if (c1 !== c2) {
					hostSetElementText(container, c2);
				}
			}
		} else {
			// text -> array
			if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
				hostSetElementText(container, "");
				mountChildren(c2, container, parentComponent, anchor);
			} else {
				// array diff children
				patchKeyedChildren(c1, c2, container, parentComponent, anchor)
			}
		}
	}

	function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {

		// const l2 = c2.length;

		let i = 0;
		let e1 = c1.length - 1;
		let e2 = c2.length - 1;
		// debugger
		function isSameVNodeType(n1, n2) {
			// type 和 key 判断两种
			return n1.type === n2.type && n1.key === n2.key;
		}

		// 1. 左侧对比  i指针->向右移动
		while (i <= e1 && i <= e2) {
			const n1 = c1[i];
			const n2 = c2[i];

			if (isSameVNodeType(n1, n2)) {
				patch(n1, n2, container, parentComponent, parentAnchor);
			} else {
				break;
			}
			i++;
		}
		// 2. 右侧对比  e1和e2指针->向左移动
		while (i <= e1 && i <= e2) {
			const n1 = c1[e1];
			const n2 = c2[e2];

			if (isSameVNodeType(n1, n2)) {
				patch(n1, n2, container, parentComponent, parentAnchor);
			} else {
				break;
			}
			e1--;
			e2--;
		}

		// 3. 新的比老的长 - 左侧和右侧 创建新的
		if (i > e1) {
			if (i <= e2) {
				// debugger;
				const nextPos = e2 + 1; // 锚点位置
				const anchor = nextPos < c2.length ? c2[nextPos].el : null; // 判断：左侧对比 -> null 还在后面插入节点 右侧对比 -> 找"A"节点传入 在"A"前面插入
				// 多个 child 遍历执行 patch
				while (i <= e2) {
					patch(null, c2[i], container, parentComponent, anchor);
					i++;
				}
			}
		}
		// 4. 老的比新的长 - 左侧和右侧 删除老的
		else if (i > e2) {
			while (i <= e1) {
				hostRemove(c1[i].el);
				i++;
			}
		}
		// 5. 中间对比
		else {
			let s1 = i;
			let s2 = i;

			/**
			 * 删除的优化：
			 * 新节点中 对比一次就记录一次；新节点全部对比完成后，如果老节点还有剩余元素的话
			 * 就可以把这些全部删除
			 */
			const toBePatched = e2 - s2 + 1; // 新的中需要对比的全部数量
			let patched = 0; // 已经对比完成的

			// 基于新的 里面的 key 建立 映射表
			const keyToNewIndexMap = new Map()
			for (let i = s2; i <= e2; i++) {
				const nextChild = c2[i];
				keyToNewIndexMap.set(nextChild.key, i);

			}

			// 遍历老的
			for (let i = s1; i <= e1; i++) {
				// 拿到当前节点
				const prevChild = c1[i];

				if (patched > toBePatched) {
					hostRemove(prevChild.el);
					continue;
				}

				let newIndex;
				// 判断 null 和 undefined
				if (prevChild.key !== null) {
					newIndex = keyToNewIndexMap.get(prevChild.key);
				} else {
					// 如果没有 key 就需要遍历判断 性能低
					for (let j = s2; j <= e2; j++) {
						if (isSameVNodeType(prevChild, c2[j])) {
							newIndex = j;
							break;
						}
					}
				}

				// 如果newIndex存在，就说明 新老里面都有该节点
				// 不存在 就删除老的
				if (newIndex === undefined) {
					hostRemove(prevChild.el);
				} else {
					patch(prevChild, c2[newIndex], container, parentComponent, null);
					patched++;
				}
			}



		}
	}



	function unmountChildren(children) {
		for (let i = 0; i < children.length; i++) {
			const el = children[i].el;
			// remove
			hostRemove(el);
		}
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

	function mountElement(vnode, container, parentComponent, anchor) {
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
			mountChildren(vnode.children, el, parentComponent, anchor); // 抽离-优化
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
		hostInsert(el, container, anchor);
	}

	function mountChildren(children: any, el: any, parentComponent, anchor) {
		children.forEach((v) => {
			patch(null, v, el, parentComponent, anchor);
		});
	}

	// component 类型
	function processComponent(n1, n2: any, container: any, parentComponent, anchor) {
		mountComponent(n2, container, parentComponent, anchor);
	}

	function mountComponent(vnode: any, container, parentComponent, anchor) {
		// 创建组件实例
		const instance = createComponentInstance(vnode, parentComponent);

		setupComponent(instance);

		setupRenderEffect(instance, container, anchor);
	}

	function setupRenderEffect(instance: any, container, anchor) {
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
				patch(null, subTree, container, instance, anchor); // parentComponent -> instance

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

				patch(prevSubTree, subTree, container, instance, anchor);
			}
		});
	}

	// slot 的 Fragment 和 Text
	function processFragment(n1, n2: any, container: any, parentComponent, anchor) {
		mountChildren(n2.children, container, parentComponent, anchor);
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
