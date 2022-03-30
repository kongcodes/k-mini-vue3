import { isReadonly, readonly } from "../reactive";

describe("readonly", () => {
	it("happy path", () => {
		// not allow set
		const original = { foo: 1, bar: { baz: 1 } };
		const wrapped = readonly(original);
		expect(wrapped).not.toBe(original);
		expect(wrapped.foo).toBe(1);

		// isReadonly
		expect(isReadonly(wrapped)).toBe(true);
		expect(isReadonly(original)).toBe(false);

		// 深层嵌套
		expect(isReadonly(wrapped.bar)).toBe(true);
		expect(isReadonly(original.bar)).toBe(false);
	});

	it("warn when call set", () => {
		const user = readonly({ age: 10 });
		// mock -> 验证 console.warn 有没有被调用
		console.warn = jest.fn();
		user.age = 11;
		expect(console.warn).toBeCalled();
	});
});
