import { h } from "../../lib/k-mini-vue3.esm.js";

import ArrayToText from "./ArrayToText.js";
import ArrayToArray from "./ArrayToArray.js";
import TextToText from "./TextToText.js";
import TextToArray from "./TextToArray.js";

export const App = {
	name: "App",
	setup() {},
	render() {
		// console.log(this.count);
		return h("div", { tId: 1 }, [
			h("p", {}, "主页"),
			// 老的是 array， 新的是 text
			//  h(ArrayToText),
			// 老的是 text， 新的是 text
			// h(TextToText),
			// 老的是 text， 新的是 text
			h(TextToArray),
		]);
	},
};
