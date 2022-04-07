import { createComponentInstance, setupComponent } from "./component";

export function render(vnode, container) {
	// patch
	patch(vnode, container);
}

function patch(vnode, container) {
	/**
	 * TODO
	 * 区分是 element 还是 component
	 * 判断两种类型
	 */

	// TODO processElement()

	// 去处理组件
	processComponent(vnode, container);
}

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
	const subTree = instance.render();

	// vnode -> patch
	// vnode -> element -> mountElement
	patch(subTree, container);
}
