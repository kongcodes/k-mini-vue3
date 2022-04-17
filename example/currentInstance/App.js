import { h, getCurrentInstance } from "../../lib/k-mini-vue3.esm.js";
import { Foo } from "./Foo.js";

export const App = {
	name: "App",
	setup() {
		const instance = getCurrentInstance();
		console.log("App:", instance);
	},
	render() {
		const p = h("p", {}, "App");
		return h("div", { class: "app-border" }, [p, h(Foo)]);
	},
};
