import { ShapeFlags } from "../shared/ShapeFlags";

export const Fragment = Symbol("Fragment");
export const Text = Symbol("Text");

export function createVNode(type, props?, children?) {
	const vnode = {
		type,
		props,
		children,
		component: null,
		key: props && props.key,
		shapeFlag: getShapeFlag(type),
		el: null, // $el
	};

	// 重构优化 ShapeFlags
	// 判断children类型
	if (typeof children === "string") {
		vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
	} else if (Array.isArray(children)) {
		vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
	}
	// 判断 children 是 slot(是slot的条件： 组件 + children是对象)
	if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
		if (typeof children === "object") {
			vnode.shapeFlag |= ShapeFlags.SLOT_CHILDREN;
		}
	}

	return vnode;
}

// 重构优化 ShapeFlags
// 判断type类型
function getShapeFlag(type) {
	return typeof type === "string"
		? ShapeFlags.ELEMENT
		: ShapeFlags.STATEFUL_COMPONENT;
}

export function createTextVnode(text) {
	return createVNode(Text, {}, text);
}
