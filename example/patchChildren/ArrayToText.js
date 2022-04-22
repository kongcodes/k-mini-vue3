import { h, ref } from "../../lib/k-mini-vue3.esm.js";
const nextChildren = "newChildren";
const prevChildren = [h("div", {}, "A"), h("div", {}, "B")];

export default {
	name: "ArrayToText",
	setup() {
		const isChange = ref(false);
		window.isChange = isChange;

		return {
			isChange,
		};
	},
	render() {
		const self = this;

		return self.isChange === true
			? h("div", {}, nextChildren)
			: h("div", {}, prevChildren);
	},
};
