const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        key: props && props.key,
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
function createTextVnode(text) {
    return createVNode(Text, {}, text);
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
            return createVNode(Fragment, {}, slot(props));
        }
        // return createVNode("div", {}, slot);
    }
}

const EMPTY_OBJ = {};
const extend = Object.assign;
function isObject(val) {
    return val !== null && typeof val === "object";
}
const hasChanged = (value, newValue) => {
    return !Object.is(value, newValue);
};
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

let activeEffect;
let shouldTrack;
class reactiveEffect {
    constructor(fn, scheduler) {
        // stop
        this.deps = [];
        this.active = true;
        this._fn = fn;
        this.scheduler = scheduler;
    }
    run() {
        if (!this.active) {
            // runner方法需要得到fn的返回值
            return this._fn();
        }
        // 应该收集
        shouldTrack = true;
        activeEffect = this;
        const r = this._fn();
        // reset
        shouldTrack = false;
        return r;
    }
    stop() {
        if (this.active) {
            cleanupEffect(this);
            // stop时 调用onStop方法
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}
function cleanupEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    effect.deps.length = 0;
}
const targetMap = new Map();
function track(target, key) {
    // target -> key -> dep
    // targetMap -> { target: depsMap }
    // depsMap -> {key: dep}
    // dep -> activeEffect
    if (!isTracking())
        return; // 抽离-优化
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    effectTracks(dep);
}
function effectTracks(dep) {
    if (dep.has(activeEffect))
        return; // 防止重复收集
    dep.add(activeEffect);
    // track的时候收集dep，stop会用到
    activeEffect.deps.push(dep);
}
function isTracking() {
    // if (!activeEffect) return; //解决只用reactive时，deps undefined的情况
    // if (!shouldTrack) return; //解决stop后还会track的问题
    return shouldTrack && activeEffect !== undefined;
}
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
function effect(fn, options = {}) {
    const _effect = new reactiveEffect(fn, options.scheduler);
    _effect.run();
    // _effect.onStop = options.onStop; // 抽离-优化
    extend(_effect, options);
    // 返回的 runner函数
    // run方法用到了this,使用bind处理指针问题
    const runner = _effect.run.bind(_effect);
    // stop 要用到 _effect上面的方法
    runner.effect = _effect;
    return runner;
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
        if (!isReadonly) {
            // 依赖收集
            track(target, key);
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

// {} -> value -> get set
class RefImpl {
    constructor(value) {
        this.__v_isRef = true;
        this._rawValue = value;
        this._value = convert(value);
        // value 是对象的话需要转换成 reactive
        this.dep = new Set();
    }
    get value() {
        // 只用到 get value时，track里面的activeEffect.deps 为undefined，解决这个问题
        trackRefValue(this);
        return this._value;
    }
    set value(newValue) {
        // 新旧值不改变，就不执行
        // 使用_rawValue，因为这个值是没有被reactive处理过的，是一个普通obj
        // 如果传入的是对象，_value就是被处理过的 proxy对象，hasChanged只能传入普通对象做比较
        if (hasChanged(newValue, this._rawValue)) {
            // 要先修改value，再触发依赖
            this._rawValue = newValue;
            this._value = convert(newValue);
            effectTriggers(this.dep);
        }
    }
}
function trackRefValue(ref) {
    if (isTracking()) {
        effectTracks(ref.dep);
    }
}
// 如果传入 ref 的是一个对象，内部也会调用 reactive 方法进行深层响应转换
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function ref(value) {
    return new RefImpl(value);
}
function isRef(ref) {
    // 如果传入数值 1 这种参数，ref.__v_isRef会是undefined，所以用!!转换成Boolean
    return !!ref.__v_isRef;
}
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value);
            }
            else {
                return Reflect.set(target, key, value);
            }
        },
    });
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

function createComponentInstance(vnode, parent) {
    // console.log("parent", parent);
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        provides: parent ? parent.provides : {},
        parent,
        isMounted: false,
        subTree: {},
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
        setCurrentInstance(instance);
        // 用户可能不写setup
        // setup() 可能返回 function 或者 object
        // 如果是function 就认为组件返回了render函数
        // 如果是object 会把object注入到组件上下文中
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        });
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // TODO function
    if (typeof setupResult === "object") {
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (Component.render) {
        instance.render = Component.render;
    }
}
// getCurrentInstance Api
let currentInstance = null;
function setCurrentInstance(instance) {
    currentInstance = instance;
}
function getCurrentInstance() {
    return currentInstance;
}

function provide(key, value) {
    // 存
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        const parentProvides = currentInstance.parent.provides;
        // 判断是初始化的时候才执行
        if (provides === parentProvides) {
            // 给 provides 指定原型链对象为 父级
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    // 取
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const parentProvides = currentInstance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            // 处理默认值  可能是字符串或函数
            if (typeof defaultValue === "function") {
                return defaultValue();
            }
            return defaultValue;
        }
    }
}

// import { render } from "./renderer";
function createAppAPI(render) {
    return function createApp(rootComponent) {
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
    };
}
// export function createApp(rootComponent) {
// 	return {
// 		mount(rootContainer) {
// 			/**
// 			 * 先将内容解析成 vnode
// 			 * component -> vnode
// 			 * 后面的所有逻辑都会基于 vnode 进行操作
// 			 */
// 			// rootContainer -> dom
// 			if (typeof rootContainer === "string") {
// 				rootContainer = document.querySelector(rootContainer);
// 			}
// 			const vnode = createVNode(rootComponent);
// 			render(vnode, rootContainer);
// 		},
// 	};
// }

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText, } = options;
    function render(vnode, container) {
        // patch
        // console.log("vnode-----", vnode);
        patch(null, vnode, container, null, null); // 处理根组件不传 parentComponent 参数
    }
    // 优化 patch 架构
    // n1 -> 老的，如果不存在则是初始化,存在就是更新逻辑
    // n2 -> 新的
    // function patch(vnode, container, parentComponent) {
    function patch(n1, n2, container, parentComponent, anchor) {
        /**
         * 区分是 element 还是 component
         * 判断两种类型
         */
        // debugger;
        // console.log("patch-------", vnode);
        // 使用 shapeFlag 判断类型
        const { type, shapeFlag } = n2;
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent, anchor);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                // shapeFlag & ShapeFlags.STATEFUL_COMPONENT 等同于 typeof vnode.type === "object"
                if (shapeFlag & 2 /* STATEFUL_COMPONENT */) {
                    // 处理component
                    processComponent(n1, n2, container, parentComponent, anchor);
                }
                else if (shapeFlag & 1 /* ELEMENT */) {
                    // 处理 element
                    processElement(n1, n2, container, parentComponent, anchor);
                }
                break;
        }
    }
    // element 类型
    function processElement(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountElement(n2, container, parentComponent, anchor);
        }
        else {
            patchElement(n1, n2, container, parentComponent, anchor);
        }
    }
    function patchElement(n1, n2, container, parentComponent, anchor) {
        console.log("n1", n1);
        console.log("n2", n2);
        console.log("container", container);
        // update props
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        const el = n1.el;
        n2.el = el; // 本轮n2就是下一轮的n1，不赋值的话 下轮n1中就没有el
        patchChildren(n1, n2, el, parentComponent, anchor);
        patchProps(el, oldProps, newProps);
    }
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        const prevShapeFlag = n1.shapeFlag;
        const nextShapeFlag = n2.shapeFlag;
        const c1 = n1.children;
        const c2 = n2.children;
        if (nextShapeFlag & 4 /* TEXT_CHILDREN */) {
            // TODO 优化
            if (prevShapeFlag & 8 /* ARRAY_CHILDREN */) {
                // array -> text
                // 1. 把老的清空
                unmountChildren(n1.children);
                // 2. 设置text
                hostSetElementText(container, c2);
            }
            else {
                // text -> text
                // 前后节点不一样才需要改变
                if (c1 !== c2) {
                    hostSetElementText(container, c2);
                }
            }
        }
        else {
            // text -> array
            if (prevShapeFlag & 4 /* TEXT_CHILDREN */) {
                hostSetElementText(container, "");
                mountChildren(c2, container, parentComponent, anchor);
            }
            else {
                // array diff children
                patchKeyedChildren(c1, c2, container, parentComponent, anchor);
            }
        }
    }
    function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
        // const l2 = c2.length;
        let i = 0;
        let e1 = c1.length - 1;
        let e2 = c2.length - 1;
        // debugger
        function isSameVNodeType(n1, n2) {
            // type 和 key 判断两种
            return n1.type === n2.type && n1.key === n2.key;
        }
        // 1. 左侧对比  i指针->向右移动
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            if (isSameVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            i++;
        }
        // 2. 右侧对比  e1和e2指针->向左移动
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSameVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        // 3. 新的比老的长 - 左侧和右侧 创建新的
        if (i > e1) {
            if (i <= e2) {
                // debugger;
                const nextPos = e2 + 1; // 锚点位置
                const anchor = nextPos < c2.length ? c2[nextPos].el : null; // 判断：左侧对比 -> null 还在后面插入节点 右侧对比 -> 找"A"节点传入 在"A"前面插入
                // 多个 child 遍历执行 patch
                while (i <= e2) {
                    patch(null, c2[i], container, parentComponent, anchor);
                    i++;
                }
            }
        }
        // 4. 老的比新的长 - 左侧和右侧 删除老的
        else if (i > e2) {
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        // 中间对比
        else ;
    }
    function unmountChildren(children) {
        for (let i = 0; i < children.length; i++) {
            const el = children[i].el;
            // remove
            hostRemove(el);
        }
    }
    function patchProps(el, oldProps, newProps) {
        if (oldProps !== newProps) {
            // 健壮性
            for (const key in newProps) {
                const prevProp = oldProps[key];
                const nextProp = newProps[key];
                if (prevProp !== nextProp) {
                    hostPatchProp(el, key, prevProp, nextProp);
                }
            }
            if (oldProps !== EMPTY_OBJ) {
                // 健壮性
                // update props 的第三种情况：属性被删除
                for (const key in oldProps) {
                    if (!(key in newProps)) {
                        hostPatchProp(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    function mountElement(vnode, container, parentComponent, anchor) {
        const { type, children, props } = vnode;
        // 编写 api customRenderer,需要抽离document等web平台的相关函数
        // const el = document.createElement(type);
        const el = hostCreateElement(type);
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
            mountChildren(vnode.children, el, parentComponent, anchor); // 抽离-优化
        }
        // props
        for (const key in props) {
            const val = props[key];
            // console.log(key);
            // 编写 api customRenderer,需要抽离document等web平台的相关函数
            // if (isOn(key)) {
            // 	const eventName = key.slice(2).toLowerCase(); //onClick等，删除 on 变成小写
            // 	el.addEventListener(eventName, val);
            // } else {
            // 	el.setAttribute(key, val);
            // }
            hostPatchProp(el, key, null, val);
        }
        // 编写 api customRenderer,需要抽离document等web平台的相关函数
        // container.append(el);
        hostInsert(el, container, anchor);
    }
    function mountChildren(children, el, parentComponent, anchor) {
        children.forEach((v) => {
            patch(null, v, el, parentComponent, anchor);
        });
    }
    // component 类型
    function processComponent(n1, n2, container, parentComponent, anchor) {
        mountComponent(n2, container, parentComponent, anchor);
    }
    function mountComponent(vnode, container, parentComponent, anchor) {
        // 创建组件实例
        const instance = createComponentInstance(vnode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, container, anchor);
    }
    function setupRenderEffect(instance, container, anchor) {
        // 使用effect包裹原来的逻辑，收集依赖
        effect(() => {
            if (!instance.isMounted) {
                // 未挂载就是 init 初始化
                const { proxy } = instance;
                const subTree = instance.render.call(proxy); // 第一次执行App.js根组件中的render函数，这个函数返回由h创建的vnode
                // 保存老的vnode prevSubTree
                instance.subTree = subTree;
                // console.log("--subTree", subTree);
                // vnode -> patch
                // vnode -> element -> mountElement
                patch(null, subTree, container, instance, anchor); // parentComponent -> instance
                // all element -> mount
                // $el根节点赋值到当前组件vnode的el上面
                instance.vnode.el = subTree.el;
                // init完成
                instance.isMounted = true;
            }
            else {
                // update
                const { proxy } = instance;
                const subTree = instance.render.call(proxy);
                const prevSubTree = instance.subTree;
                // 把老的更新，保证下次进入是正确的
                instance.subTree = subTree;
                patch(prevSubTree, subTree, container, instance, anchor);
            }
        });
    }
    // slot 的 Fragment 和 Text
    function processFragment(n1, n2, container, parentComponent, anchor) {
        mountChildren(n2.children, container, parentComponent, anchor);
    }
    function processText(n1, n2, container) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children)); // 需要赋值给vnode的el
        container.append(textNode);
    }
    // 解决 createRenderer之后，createApp 无法再使用 render 的问题
    return {
        createApp: createAppAPI(render),
    };
}

function createElement(type) {
    console.log("createElement------------");
    return document.createElement(type);
}
/**
 * @param el
 * @param key
 * @param prevVal
 * @param val -> nextVal 当前的值
 */
function patchProp(el, key, prevVal, val) {
    // console.log("patchProp------------");
    if (isOn(key)) {
        const eventName = key.slice(2).toLowerCase(); //onClick等，删除 on 变成小写
        el.addEventListener(eventName, val);
    }
    else {
        if (val === undefined || val === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, val);
        }
    }
}
function insert(el, parent, anchor) {
    // console.log("insert------------");
    // parent.append(el);
    parent.insertBefore(el, anchor || null);
}
function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
function setElementText(el, text) {
    el.textContent = text;
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText,
});
function createApp(...args) {
    return renderer.createApp(...args);
}

export { createApp, createRenderer, createTextVnode, getCurrentInstance, h, inject, provide, proxyRefs, ref, renderSlots };
