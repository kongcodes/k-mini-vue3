import { h, ref } from "../../lib/k-mini-vue3.esm.js";

export const App = {
	name: "App",
	setup() {
		const count = ref(1);
		const onClick = () => {
			count.value++;
		};

		// 更新element的props
		const props = ref({
			foo: "foo",
			bar: "bar",
		});
		const updateProp1 = () => {
			console.log(1);
			props.value.foo = "newFoo";
		};
		const updateProp2 = () => {
			props.value.foo = undefined;
		};
		const updateProp3 = () => {
			props.value = {
				foo: "foo",
			};
		};

		return {
			count,
			onClick,
			// 更新element的props
			updateProp1,
			updateProp2,
			updateProp3,
			props,
		};
	},
	render() {
		// console.log(this.count);
		return h(
			"div",
			{
				id: "root",
				...this.props,
			},
			[
				h("div", {}, `count: ${this.count}`), // this.count触发get操作，收集依赖
				h("button", { onClick: this.onClick }, "+1"),
				// 更新element的props
				h("button", { onClick: this.updateProp1 }, "foo值改变-》修改"),
				h(
					"button",
					{ onClick: this.updateProp2 },
					"foo值变成null或undefined->删除"
				),
				h("button", { onClick: this.updateProp3 }, "bar值消失-》删除"),
			]
		);
	},
};
