import { h, provide, inject } from "../../lib/k-mini-vue3.esm.js";

const Provider = {
	name: "Provider",
	setup() {
		provide("foo", "fooVal");
		provide("bar", "barVal");
	},
	render() {
		return h("div", {}, [h("p", {}, "Provider"), h(ProviderTwo)]);
	},
};

const ProviderTwo = {
	name: "ProviderTwo",
	setup() {
		provide("foo", "fooTwo");
		const foo = inject("foo");

		return {
			foo,
		};
	},
	render() {
		return h("div", {}, [h("p", {}, `ProviderTwo: ${this.foo}`), h(Customer)]);
	},
};

const Customer = {
	name: "Customer",
	setup() {
		const foo = inject("foo");
		const bar = inject("bar");
		// 测试 inject 默认值
		// const baz = inject("baz", "defaultBaz"); // 默认值是 字符串
		const baz = inject("baz", () => "defaultBaz"); // 默认值是 函数

		return {
			foo,
			bar,
			baz,
		};
	},
	render() {
		return h("div", {}, `Customer: ${this.foo} - ${this.bar} - ${this.baz}`);
	},
};

export const App = {
	name: "App",
	setup() {},
	render() {
		const p = h("p", {}, "App");
		return h("div", { class: "app-border" }, [p, h(Provider)]);
	},
};
