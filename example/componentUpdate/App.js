import { h, ref } from "../../lib/k-mini-vue3.esm.js";
import { Child } from "./Child.js";

export const App = {
  name: "App",
  setup() {
    const msg = ref("123");
    const count = ref(1);

    window.msg = msg; // 可以在浏览器控制台执行 msg.value = xxx

    const changeChildProps = () => {
      msg.value = "456";
    };

    const changeCount = () => {
      count.value++;
    };

    return {
      msg,
      count,
      changeChildProps,
      changeCount,
    };
  },
  render() {
    const p = h("p", {}, "App");
    return h("div", {}, [
      p,
      h(
        "button",
        {
          onClick: this.changeChildProps,
        },
        "changeChildProps"
      ),

      h(Child, { msg: this.msg }),
      h(
        "button",
        {
          onClick: this.changeCount,
        },
        "changeCount更新和Child组件没有关系的数据"
      ),
      h("p", {}, `count: ${this.count}`),
    ]);
  },
};
