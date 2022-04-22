import { h, ref } from "../../lib/k-mini-vue3.esm.js";
/**
 * text -> text
 */
const nextChildren = "newChildren";
const prevChildren = "oldChildren";

export default {
	name: "TextToText",
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
