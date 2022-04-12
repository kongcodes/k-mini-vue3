import { h } from "../../lib/k-mini-vue3.esm.js";

export const Foo = {
	setup(props) {
		console.log(props);
		props.count++; // warn not allow update
		console.log(props);
	},
	render() {
		return h("div", {}, "Foo:" + this.count);
	},
};
