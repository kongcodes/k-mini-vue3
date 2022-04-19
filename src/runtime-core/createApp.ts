// import { render } from "./renderer";
import { createVNode } from "./vnode";

export function createAppAPI(render) {
	return function createApp(rootComponent) {
		return {
			mount(rootContainer) {
				/**
				 * 先将内容解析成 vnode
				 * component -> vnode
				 * 后面的所有逻辑都会基于 vnode 进行操作
				 */

				// rootContainer -> dom
				if (typeof rootContainer === "string") {
					rootContainer = document.querySelector(rootContainer);
				}

				const vnode = createVNode(rootComponent);

				render(vnode, rootContainer);
			},
		};
	};
}

// export function createApp(rootComponent) {
// 	return {
// 		mount(rootContainer) {
// 			/**
// 			 * 先将内容解析成 vnode
// 			 * component -> vnode
// 			 * 后面的所有逻辑都会基于 vnode 进行操作
// 			 */

// 			// rootContainer -> dom
// 			if (typeof rootContainer === "string") {
// 				rootContainer = document.querySelector(rootContainer);
// 			}

// 			const vnode = createVNode(rootComponent);

// 			render(vnode, rootContainer);
// 		},
// 	};
// }
