export function initProps(instance, rawProps) {
	instance.props = rawProps || {}; // shallowReadonly 时参数必须为对象，如果没有传props， rawProps === undefined 报错
}
