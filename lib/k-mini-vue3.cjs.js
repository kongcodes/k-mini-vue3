'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function isObject(val) {
    return val !== null && typeof val === "object";
}
// 事件注册
const isOn = (key) => /^on[A-Z]/.test(key);

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
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
    // ctx
    instance.proxy = new Proxy({}, {
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
    });
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
    console.log("vnode-----", vnode);
    patch(vnode, container);
}
function patch(vnode, container) {
    /**
     * 区分是 element 还是 component
     * 判断两种类型
     */
    // debugger;
    console.log("patch-------", vnode);
    if (isObject(vnode.type)) {
        // 去处理组件
        processComponent(vnode, container);
    }
    else if (typeof vnode.type === "string") {
        processElement(vnode, container);
    }
}
// element 类型
function processElement(vnode, container) {
    mountElement(vnode, container);
}
function mountElement(vnode, container) {
    const { type, children, props } = vnode;
    const el = document.createElement(type);
    // $el
    // vnode -> element -> div
    vnode.el = el;
    // children -> string or array
    if (typeof children === "string") {
        // children is string
        el.textContent = children;
    }
    else if (Array.isArray(children)) {
        // children is array
        mountChildren(vnode.children, el); // 抽离-优化
    }
    // props
    for (const key in props) {
        const val = props[key];
        console.log(key);
        if (isOn(key)) {
            const eventName = key.slice(2).toLowerCase(); //onClick等，删除 on 变成小写
            el.addEventListener(eventName, val);
        }
        else {
            el.setAttribute(key, val);
        }
    }
    container.append(el);
}
function mountChildren(children, el) {
    children.forEach((v) => {
        patch(v, el);
    });
}
// component 类型
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
function mountComponent(vnode, container) {
    // 创建组件实例
    const instance = createComponentInstance(vnode);
    setupComponent(instance);
    setupRenderEffect(instance, container);
}
function setupRenderEffect(instance, container) {
    const { proxy } = instance;
    const subTree = instance.render.call(proxy);
    // vnode -> patch
    // vnode -> element -> mountElement
    patch(subTree, container);
    // all element -> mount
    // $el根节点赋值到当前组件vnode的el上面
    instance.vnode.el = subTree.el;
}

function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        el: null, // $el
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
            // rootContainer -> dom
            if (typeof rootContainer === "string") {
                rootContainer = document.querySelector(rootContainer);
            }
            const vnode = createVNode(rootComponent);
            render(vnode, rootContainer);
        },
    };
}

function h(type, props, children) {
    // childred -> string or array
    return createVNode(type, props, children);
}

exports.createApp = createApp;
exports.h = h;
