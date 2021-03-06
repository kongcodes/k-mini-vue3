import { effect } from "../effect";
import { reactive } from "../reactive";
import { isRef, proxyRefs, ref, unRef } from "../ref";

describe("ref", () => {
	it("happy path", () => {
		const count = ref(1);
		expect(count.value).toBe(1);
	});

	it("shoule be reactive", () => {
		const a = ref(1);
		let dummy;
		let calls = 0;
		effect(() => {
			calls++;
			dummy = a.value;
		});
		expect(calls).toBe(1);
		expect(dummy).toBe(1);
		a.value = 2;
		expect(calls).toBe(2);
		expect(dummy).toBe(2);
		// same value should not trigger
		a.value = 2;
		expect(calls).toBe(2);
		expect(dummy).toBe(2);
	});

	it("should make nested properties reactive", () => {
		const a = ref({
			count: 1,
		});
		let dummy;
		effect(() => {
			dummy = a.value.count;
		});
		expect(dummy).toBe(1);
		a.value.count = 2;
		expect(dummy).toBe(2);
	});

	it("isRef", () => {
		const count = ref(1);
		const user = reactive({
			age: 1,
		});
		expect(isRef(count)).toBe(true);
		expect(isRef(user)).toBe(false);
		expect(isRef(1)).toBe(false);
	});

	it("unRef", () => {
		// unRef() -> ref.value
		const count = ref(1);
		expect(unRef(count)).toBe(1);
		expect(unRef(1)).toBe(1);
	});

	it("proxyRefs", () => {
		const user = {
			age: ref(10),
			name: "tom",
		};

		const proxyUser = proxyRefs(user);

		// get
		expect(user.age.value).toBe(10);
		expect(proxyUser.age).toBe(10);
		expect(proxyUser.name).toBe("tom");

		// set
		proxyUser.age = 20;
		expect(user.age.value).toBe(20);
		expect(proxyUser.age).toBe(20);

		// set
		proxyUser.age = ref(10);
		expect(user.age.value).toBe(10);
		expect(proxyUser.age).toBe(10);
	});
});
