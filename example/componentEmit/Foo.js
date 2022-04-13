import { h } from "../../lib/k-mini-vue3.esm.js";

export const Foo = {
	setup(props, { emit }) {
		const add = () => {
			console.log(`click add`);
			emit("add", 1, 2);
			// kebab-case
			emit("foo-add");
		};

		console.log(props);
		return {
			add,
		};
	},
	render() {
		return h("button", { class: "w-100 h-30", onClick: this.add }, "foo");
	},
};
