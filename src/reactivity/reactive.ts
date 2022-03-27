import { mutableHanders, readonlyHanders } from "./baseHandles";

export function reactive(raw) {
	return createReactiveObject(raw, mutableHanders);
}

export function readonly(raw) {
	return createReactiveObject(raw, readonlyHanders);
}

function createReactiveObject(raw, baseHandles) {
	return new Proxy(raw, baseHandles);
}
