'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const extend = Object.assign;
function isObject(val) {
    return val !== null && typeof val === "object";
}
// 事件注册
const isOn = (key) => /^on[A-Z]/.test(key);
// props
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);

const targetMap = new Map();
function trigger(target, key) {
    const depsMap = targetMap.get(target);
    const dep = depsMap.get(key);
    effectTriggers(dep);
}
function effectTriggers(dep) {
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}

const get = createdGetter();
const set = createdSetter();
const readonlyGet = createdGetter(true);
const shallowReadonlyGet = createdGetter(true, true);
function createdGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        if (key === "__v_isReactive" /* IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "__v_isReadonly" /* IS_READONLY */) {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        if (shallow) {
            return res;
        }
        // 对象的嵌套转换 -> 如果是普通对象就转换成reactive或者readonly对象
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
}
function createdSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        // 触发依赖
        trigger(target, key);
        return res;
    };
}
const mutableHanders = {
    get,
    set,
};
const readonlyHanders = {
    get: readonlyGet,
    set(target, key) {
        console.warn(`key :"${String(key)}" set 失败，因为 target 是 readonly 类型`, target);
        return true;
    },
};
const shallowReadonlyHanders = extend({}, readonlyHanders, {
    get: shallowReadonlyGet,
});

function reactive(raw) {
    return createReactiveObject(raw, mutableHanders);
}
function readonly(raw) {
    return createReactiveObject(raw, readonlyHanders);
}
function shallowReadonly(raw) {
    return createReactiveObject(raw, shallowReadonlyHanders);
}
function createReactiveObject(target, baseHandles) {
    if (!isObject(target)) {
        console.warn(`target: ${target} 必须是一个对象`);
    }
    return new Proxy(target, baseHandles);
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {}; // shallowReadonly 时参数必须为对象，如果没有传props， rawProps === undefined 报错
}

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
    };
    return component;
}
function setupComponent(instance) {
    initProps(instance, instance.vnode.props);
    // TODO
    // initSlots();
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    // ctx
    instance.proxy = new Proxy({}, {
        get(target, key) {
            const { setupState, props } = instance;
            // if (key in setupState) {
            // 	return setupState[key];
            // }
            if (hasOwn(setupState, key)) {
                return setupState[key];
            }
            else if (hasOwn(props, key)) {
                // props
                return props[key];
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
        const setupResult = setup(shallowReadonly(instance.props));
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
    // console.log("vnode-----", vnode);
    patch(vnode, container);
}
function patch(vnode, container) {
    /**
     * 区分是 element 还是 component
     * 判断两种类型
     */
    // debugger;
    // console.log("patch-------", vnode);
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
        // console.log(key);
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
