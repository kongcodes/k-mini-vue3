import { mutableHanders, readonlyHanders } from "./baseHandles";

export const enum ReactiveFlags {
	IS_REACTIVE = "__v_isReactive",
	IS_READONLY = "__v_isReadonly",
}

export function reactive(raw) {
	return createReactiveObject(raw, mutableHanders);
}

export function readonly(raw) {
	return createReactiveObject(raw, readonlyHanders);
}

export function isReactive(value) {
	return !!value[ReactiveFlags.IS_REACTIVE];
}

export function isReadonly(value) {
	return !!value[ReactiveFlags.IS_READONLY];
}

function createReactiveObject(raw, baseHandles) {
	return new Proxy(raw, baseHandles);
}
