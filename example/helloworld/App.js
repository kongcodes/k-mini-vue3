import { h } from "../../lib/k-mini-vue3.esm.js";

export const App = {
	render() {
		return h(
			"div",
			{
				id: "root",
				class: ["blue", "font-30"],
			},
			// "hello, k-mini-vue3"  // children is string
			[
				h("p", { class: "red" }, "是一个p标签"),
				h("span", { class: "blue" }, "是一个span标签"),
			] // children is array
		);
	},
	setup() {
		return {
			msg: "kongcodes",
		};
	},
};
