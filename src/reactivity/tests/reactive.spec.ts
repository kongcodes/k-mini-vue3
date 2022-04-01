import { reactive, isReactive, isProxy } from "../reactive";

describe("reactive", () => {
	it("happy path", () => {
		const original = { foo: 1 };
		const observed = reactive(original);
		expect(observed).not.toBe(original);
		expect(observed.foo).toBe(1);

		// isReactive
		expect(isReactive(observed)).toBe(true);
		expect(isReactive(original)).toBe(false);

		// isProxy
		expect(isProxy(observed)).toBe(true);
	});
	it("nested reactive", () => {
		const original = {
			obj: { foo: 1 },
			arr: [{ bar: 2 }],
		};
		const observed = reactive(original);

		expect(isReactive(observed.obj)).toBe(true);
		expect(isReactive(observed.arr)).toBe(true);
		expect(isReactive(observed.arr[0])).toBe(true);
	});
});
