import { effect, stop } from "../effect";
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

	it("runner", () => {
		// effect(fn) -> runner -> const r =  runner() -> fn() & r
		let foo = 10;
		const runner = effect(() => {
			foo++;
			return "foo";
		});
		expect(foo).toBe(11);
		const r = runner();
		expect(foo).toBe(12);
		expect(r).toBe("foo");
	});

	it("scheduler", () => {
		// 1.给effect(fn)传入第二个参数 options -> { scheduler: fn2}，也就是名为 scheduler 的一个函数
		// 2.effect 首次还会执行fn，不会执行fn2
		// 3.但如果scheduler存在，则响应式set updata 的时候不再执行fn而是执行fn2
		// 4.执行runner的时候会再次执行fn
		let dummy = 1;
		let run: any;
		const obj = reactive({ num: 1 });
		const scheduler = jest.fn(() => {
			run = runner;
		});
		const runner = effect(
			() => {
				dummy = obj.num;
			},
			{ scheduler }
		);
		// first -> be called fn,  not call scheduler
		expect(scheduler).not.toHaveBeenCalled();
		expect(dummy).toBe(1);
		// should be called on first trigger
		obj.num++;
		expect(scheduler).toHaveBeenCalledTimes(1);
		// not call fn
		expect(dummy).toBe(1);
		// manually run -> fn()
		run();
		expect(dummy).toBe(2);
	});

	it("stop", () => {
		let dummy;
		const obj = reactive({ num: 1 });
		const runner = effect(() => {
			dummy = obj.num;
		});
		expect(dummy).toBe(1);
		obj.num = 2;
		expect(dummy).toBe(2);
		stop(runner);
		// obj.num = 3;
		obj.num++; // -> obj.num = obj.num + 1;
		expect(dummy).toBe(2);

		// stopped effect should still be manually called callable
		runner();
		expect(dummy).toBe(3);
	});

	it("onStop", () => {
		// 执行 stop 方法后，会调用onStop函数，和 scheduler 相似
		const obj = reactive({ foo: 1 });
		const onStop = jest.fn();
		let dummy;
		const runner = effect(
			() => {
				dummy = obj.foo;
			},
			{ onStop }
		);

		stop(runner);
		expect(onStop).toBeCalledTimes(1);
	});
});
