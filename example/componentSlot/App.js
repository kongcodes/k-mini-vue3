import { h } from "../../lib/k-mini-vue3.esm.js";
import { Foo } from "./Foo.js";

export const App = {
	name: "App",
	setup() {
		return {};
	},
	render() {
		const p = h("p", {}, "App");
		// 1. 单个slot clot都是 vnode
		// const testSlot = h("p", { class: "slot" }, "simple slot");
		// 2. 多个slot放在数组里，需要renderSlot方法将所有slot -> vnode
		// const testSlot = [
		// 	h("p", { class: "slot" }, "slot1"),
		// 	h("p", { class: "slot" }, "slot2"),
		// ];
		// 3. 具名插槽
		//   （1） 获取到要渲染的元素
		//   （2） 获取到要渲染的位置
		// const testSlot = {
		// 	head: h("p", { class: "slot" }, "head-slot"),
		// 	foot: h("p", { class: "slot" }, "foot-slot"),
		// };
		// 4. 作用域插槽 num
		const testSlot = {
			head: ({ num }) => h("p", { class: "slot" }, "head-slot" + num),
			foot: () => h("p", { class: "slot" }, "foot-slot"),
		};

		const foo = h(Foo, {}, testSlot);
		return h("div", { class: "app-border" }, [p, foo]);
	},
};
