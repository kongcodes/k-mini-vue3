import { createVNode } from "../vnode";

export function renderSlots(slots, name, props) {
	// 非具名 不传name
	// if (!name) {
	// 	return createVNode("div", {}, slots);
	// }

	// 具名插槽
	const slot = slots[name];

	if (slot) {
		if (typeof slot === "function") {
			// 处理作用域插槽
			return createVNode("div", {}, slot(props));
		}
		// return createVNode("div", {}, slot);
	}
}
