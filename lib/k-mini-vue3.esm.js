const extend = Object.assign;
function isObject(val) {
    return val !== null && typeof val === "object";
}
// 事件注册
const isOn = (key) => /^on[A-Z]/.test(key);
// props
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
// emit
// 首字母大写 前面加on
// add -> onAdd
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
// kebab-case foo-add -> fooAdd
const camelize = (str) => {
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : "";
    });
};
const toHandlerKey = (str) => {
    return str ? "on" + capitalize(str) : "";
};

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

function emit(instance, event, ...args) {
    console.log("event--", event);
    // props里面找 emit 绑定的参数
    // emit('add') -> onAdd(){}
    const { props } = instance;
    /**
     * TPP
     * 特定行为 -> 通用行为
     */
    const handlerName = toHandlerKey(camelize(event));
    const handler = props[handlerName];
    handler && handler(...args);
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {}; // shallowReadonly 时参数必须为对象，如果没有传props， rawProps === undefined 报错
}

function initSlots(instance, children) {
    // 判断是slot的时候才执行函数,组件 && children 是 object 才是 slots
    const { shapeFlag } = instance.vnode;
    // if (typeof instance.type === "object" && typeof children === "object") {
    if (shapeFlag & 16 /* SLOT_CHILDREN */) {
        normalizeObjectSlots(instance, children);
    }
}
function normalizeObjectSlots(instance, children) {
    // children -> array
    // instance.slots = Array.isArray(children) ? children : [children];
    console.log(instance);
    // 具名插槽 -> children object
    const slots = {};
    for (const key in children) {
        const value = children[key];
        // slots[key] = normalizeSlotValue(value);
        // 作用域插槽 function
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
    instance.slots = slots;
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        emit: () => { },
    };
    // 处理emit方法，需要event和instance两个参数，但用户只传一个 add
    // 如：emit('add')
    // 所以在这里使用bind处理这个问题
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    /**
     * init
     */
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
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
            // key -> $slot
            if (key === "$slot") {
                return instance.slots;
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
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        });
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
    // 使用 shapeFlag 判断类型
    const { shapeFlag } = vnode;
    // shapeFlag & ShapeFlags.STATEFUL_COMPONENT 等同于 typeof vnode.type === "object"
    if (shapeFlag & 2 /* STATEFUL_COMPONENT */) {
        // 去处理组件
        processComponent(vnode, container);
    }
    else if (shapeFlag & 1 /* ELEMENT */) {
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
    // 使用 shapeFlag 判断类型
    const { shapeFlag } = vnode;
    if (shapeFlag & 4 /* TEXT_CHILDREN */) {
        // children is string
        el.textContent = children;
    }
    else if (shapeFlag & 8 /* ARRAY_CHILDREN */) {
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
    const subTree = instance.render.call(proxy); // 第一次执行App.js根组件中的render函数，这个函数返回由h创建的vnode
    console.log("--subTree", subTree);
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
        shapeFlag: getShapeFlag(type),
        el: null, // $el
    };
    // 重构优化 ShapeFlags
    // 判断children类型
    if (typeof children === "string") {
        vnode.shapeFlag |= 4 /* TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ARRAY_CHILDREN */;
    }
    // 判断 children 是 slot(是slot的条件： 组件 + children是对象)
    if (vnode.shapeFlag & 2 /* STATEFUL_COMPONENT */) {
        if (typeof children === "object") {
            vnode.shapeFlag |= 16 /* SLOT_CHILDREN */;
        }
    }
    return vnode;
}
// 重构优化 ShapeFlags
// 判断type类型
function getShapeFlag(type) {
    return typeof type === "string"
        ? 1 /* ELEMENT */
        : 2 /* STATEFUL_COMPONENT */;
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

function renderSlots(slots, name, props) {
    // 非具名 不传name
    // if (!name) {
    // 	return createVNode("div", {}, slots);
    // }
    // 具名插槽
    const slot = slots[name];
    if (slot) {
        if (typeof slot === "function") {
            // 处理作用域插槽
            return createVNode("div", {}, slot(props));
        }
        // return createVNode("div", {}, slot);
    }
}

export { createApp, h, renderSlots };
