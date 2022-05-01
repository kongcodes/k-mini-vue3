import { h, ref, getCurrentInstance, nextTick } from "../../lib/k-mini-vue3.esm.js";

export const App = {
	name: "App",
	setup() {

		const instance = getCurrentInstance();

		const count = ref(1);
		const onClick = () => {
			for (let i = 0; i < 100; i++) {
				console.log("update");
				count.value = i;
			}

			console.log(instance);
			// nextTick 使用方式1
			nextTick(() => {
				console.log(instance)
			})
			// nextTick 使用方式2
			// await nextTick();
			// console.log(instance);
		};

		return {
			count,
			onClick,
		};
	},
	render() {
		const button = h("button", { onClick: this.onClick }, "update");
		const p = h("p", {}, `count: ${this.count}`);
		return h("div", {}, [button, p]);
	},
};
