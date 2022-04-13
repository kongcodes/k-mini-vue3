import { camelize, toHandlerKey } from "../shared";

export function emit(instance, event, ...args) {
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
