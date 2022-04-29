import { h } from "../../lib/k-mini-vue3.esm.js";

export const Child = {
  name: "Child",
  setup(props, { emit }) {},
  render() {
    return h("p", {}, [h("div", {}, `child-props-msg: ${this.$props.msg}`)]);
  },
};
