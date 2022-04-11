import { h } from "../../lib/k-mini-vue3.esm.js";

// debug 控制台调试输出 self
window.self = null;
export const App = {
	render() {
		// debug 控制台调试输出 self
		window.self = this;
		return h(
			"div",
			{
				id: "root",
				class: ["font-30"],
				onClick() {
					console.log("click事件");
				},
				onMouseenter: () => {
					console.log("鼠标进入事件");
				},
			},
			/**
			 * 1. setupState
			 * 2. this.$el -> get root element
			 */
			"hello, " + this.msg + this.msg2 // children is string
			// [
			// 	h("p", { class: "red" }, "是一个p标签"),
			// 	h("span", { class: "blue" }, "是一个span标签"),
			// ] // children is array
		);
	},
	setup() {
		return {
			msg: "kongcodes",
			msg2: "/k-mini-vue3",
		};
	},
};
