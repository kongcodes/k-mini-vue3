import { h, renderSlots } from "../../lib/k-mini-vue3.esm.js";

export const Foo = {
	setup() {},
	render() {
		const foo = h("p", {}, "foo");
		console.log(this.$slot);
		// this.$slot 其实就是 children
		// 数组的情况：this.$slot array -> vnode
		// return h("div", { class: "child-border" }, [foo, renderSlots(this.$slot)]);

		// 具名插槽  -> 对象
		// return h("div", { class: "child-border" }, [
		// 	renderSlots(this.$slot, "head"),
		// 	foo,
		// 	renderSlots(this.$slot, "foot"),
		// ]);

		// 作用域插槽 -> function
		const num = 18;
		return h("div", { class: "child-border" }, [
			renderSlots(this.$slot, "head", {
				num,
			}),
			foo,
			renderSlots(this.$slot, "foot"),
		]);
	},
};
