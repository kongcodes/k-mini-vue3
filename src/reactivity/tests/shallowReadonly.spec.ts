import { isReadonly, shallowReadonly } from "../reactive";

describe("shallowReadonly", () => {
	it("should not make non-reactive properties reactive", () => {
		// not allow set
		const props = shallowReadonly({ n: { foo: 1 } });
		expect(isReadonly(props)).toBe(true);
		expect(isReadonly(props.n)).toBe(false);
	});

	it("warn when call set", () => {
		const user = shallowReadonly({ age: 10 });
		// mock -> 验证 console.warn 有没有被调用
		console.warn = jest.fn();
		user.age = 11;
		expect(console.warn).toBeCalled();
	});
});
