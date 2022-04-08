import { createVNode } from "./vnode";

export function h(type, props?, children?) {
	// childred -> string or array
	return createVNode(type, props, children);
}
