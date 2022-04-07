function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
    };
    return component;
}
function setupComponent(instance) {
    // TODO
    // initProps();
    // initSlots();
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
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
function handleSetupResult(instance, setupResult) {
    // TODO function
    if (typeof setupResult === "object") {
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (Component.render) {
        instance.render = Component.render;
    }
}

function render(vnode, container) {
    // patch
    patch(vnode);
}
function patch(vnode, container) {
    /**
     * TODO
     * 区分是 element 还是 component
     * 判断两种类型
     */
    // TODO processElement()
    // 去处理组件
    processComponent(vnode);
}
function processComponent(vnode, container) {
    mountComponent(vnode);
}
function mountComponent(vnode, container) {
    // 创建组件实例
    const instance = createComponentInstance(vnode);
    setupComponent(instance);
    setupRenderEffect(instance);
}
function setupRenderEffect(instance, container) {
    const subTree = instance.render();
    // vnode -> patch
    // vnode -> element -> mountElement
    patch(subTree);
}

function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
    };
    return vnode;
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            /**
             * 先将内容解析成 vnode
             * component -> vnode
             * 后面的所有逻辑都会基于 vnode 进行操作
             */
            // if rootContainer is String
            if (typeof rootContainer === "string") {
                rootComponent = document.querySelector(rootContainer);
            }
            const vnode = createVNode(rootComponent);
            render(vnode);
        },
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

export { createApp, h };
