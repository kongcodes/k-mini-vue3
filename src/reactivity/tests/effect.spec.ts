import { effect } from "../effect";
import { reactive } from "../reactive";

describe("effect", () => {
	it("happy path", () => {

		const obj = reactive({ num: 10 });
		let addnum;
		effect(() => {
			addnum = obj.num + 1;
		});
    expect(addnum).toBe(11);

    // update
    obj.num++;
    expect(addnum).toBe(12);

	});
});
