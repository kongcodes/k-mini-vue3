export function initSlots(instance, children) {
	// 组件 && children 是 object 才是 slots
	// if (typeof instance.type === "object" && typeof children === "object") {
	normalizeObjectSlots(instance, children);
	// }
}

function normalizeObjectSlots(instance, children) {
	// children -> array
	// instance.slots = Array.isArray(children) ? children : [children];

	console.log(instance);
	// 具名插槽 -> children object

	const slots = {};
	for (const key in children) {
		const value = children[key];

		// slots[key] = normalizeSlotValue(value);
		// 作用域插槽 function
		slots[key] = (props) => normalizeSlotValue(value(props));
	}

	instance.slots = slots;
}

function normalizeSlotValue(value) {
	return Array.isArray(value) ? value : [value];
}
