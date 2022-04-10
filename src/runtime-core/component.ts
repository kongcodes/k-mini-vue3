export function createComponentInstance(vnode) {
	const component = {
		vnode,
		type: vnode.type,
		setupState: {},
	};

	return component;
}

export function setupComponent(instance) {
	// TODO
	// initProps();
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
				const { setupState } = instance;
				if (key in setupState) {
					return setupState[key];
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
		const setupResult = setup();
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
