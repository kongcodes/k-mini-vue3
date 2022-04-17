import { h, getCurrentInstance } from "../../lib/k-mini-vue3.esm.js";

export const Foo = {
	name: "Foo",
	setup() {
		const instance = getCurrentInstance();
		console.log("Foo:", instance);
	},
	render() {
		return h("p", { class: "child-border" }, "foo");
	},
};
