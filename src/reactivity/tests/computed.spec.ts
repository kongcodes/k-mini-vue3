import { computed } from "../computed";
import { reactive } from "../reactive";

describe("computed", () => {
	it("happy path", () => {
		// 返回 用.value
		// 缓存
		const user = reactive({
			age: 1,
		});
		const age = computed(() => {
			return user.age;
		});
		expect(age.value).toBe(1);
	});

	it("should compute lazily", () => {
		const value = reactive({
			foo: 1,
		});
		const getter = jest.fn(() => {
			return value.foo;
		});
		const cValue = computed(getter);

		// lazy
		expect(getter).not.toHaveBeenCalled();

		expect(cValue.value).toBe(1);
		expect(getter).toHaveBeenCalledTimes(1);

		// should not compute again
		cValue.value;
		expect(getter).toHaveBeenCalledTimes(1);
		expect(cValue.value).toBe(1);

		// should not compute until needed
		value.foo = 2; // 触发trigger -> 此处需要用effect手动收集
		expect(getter).toHaveBeenCalledTimes(1); // 期望foo的值成功改变，还不允许getter被执行。所以在computed.ts中，用effect->scheduler完成

		// now should call computed
		expect(cValue.value).toBe(2);
		expect(getter).toHaveBeenCalledTimes(2);

		// should not compute again
		cValue.value;
		expect(getter).toHaveBeenCalledTimes(2); // 响应式值不改变，只用到了get，就不会调用函数，还是2次
	});
});
