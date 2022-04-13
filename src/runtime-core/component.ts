import { shallowReadonly } from "../reactivity/reactive";
import { hasOwn } from "../shared";
import { emit } from "./componentEmit";
import { initProps } from "./componentProps";

export function createComponentInstance(vnode) {
	const component = {
		vnode,
		type: vnode.type,
		setupState: {},
		props: {},
		emit: () => {},
	};

	// 处理emit方法，需要event和instance两个参数，但用户只传一个 add
	// 如：emit('add')
	// 所以在这里使用bind处理这个问题
	component.emit = emit.bind(null, component) as any;

	return component;
}

export function setupComponent(instance) {
	initProps(instance, instance.vnode.props);
	// TODO
	// initSlots();

	setupStatefulComponent(instance);
}

function setupStatefulComponent(instance: any) {
	const Component = instance.type;

	// ctx
	instance.proxy = new Proxy(
		{},
		{
			get(target, key) {
				const { setupState, props } = instance;

				// if (key in setupState) {
				// 	return setupState[key];
				// }
				if (hasOwn(setupState, key)) {
					return setupState[key];
				} else if (hasOwn(props, key)) {
					// props
					return props[key];
				}
				// key -> $el
				if (key === "$el") {
					return instance.vnode.el;
				}
			},
		}
	);

	// 拿到 setup 返回值
	const { setup } = Component;

	if (setup) {
		// 用户可能不写setup
		// setup() 可能返回 function 或者 object
		// 如果是function 就认为组件返回了render函数
		// 如果是object 会把object注入到组件上下文中
		const setupResult = setup(shallowReadonly(instance.props), {
			emit: instance.emit,
		});
		handleSetupResult(instance, setupResult);
	}
}

function handleSetupResult(instance, setupResult: any) {
	// TODO function

	if (typeof setupResult === "object") {
		instance.setupState = setupResult;
	}

	finishComponentSetup(instance);
}

function finishComponentSetup(instance: any) {
	const Component = instance.type;

	if (Component.render) {
		instance.render = Component.render;
	}
}
