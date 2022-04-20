import { h, ref } from "../../lib/k-mini-vue3.esm.js";

export const App = {
	name: "App",
	setup() {
		const count = ref(1);
		const onClick = () => {
			count.value++;
		};

		return {
			count,
			onClick,
		};
	},
	render() {
		// console.log(this.count);
		return h(
			"div",
			{
				id: "root",
			},
			[
				h("div", {}, `count: ${this.count}`), // this.count触发get操作，收集依赖
				h("button", { onClick: this.onClick }, "click"),
			]
		);
	},
};
