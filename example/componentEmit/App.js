import { h } from "../../lib/k-mini-vue3.esm.js";
import { Foo } from "./Foo.js";

export const App = {
	name: "App",
	setup() {
		return {};
	},
	render() {
		const p = h("p", {}, "App");
		return h("div", { class: "app-border" }, [
			p,
			h(Foo, {
				// add -> onAdd
				onAdd(a, b) {
					console.log("~~onAdd");
					console.log(`a+b=${a + b}`);
				},
				// kebabe-case foo-add -> onFooAdd
				onFooAdd() {
					console.log(`~~onFooAdd`);
				},
			}),
		]);
	},
};
