export const enum ShapeFlags {
	ELEMENT = 1, // 01 -> 0001  vnode.type->element类型
	STATEFUL_COMPONENT = 1 << 1, // 10 -> 0010  vnode.type->component类型
	TEXT_CHILDREN = 1 << 2, // 100 -> 0100  vnode.children->string类型
	ARRAY_CHILDREN = 1 << 3, // 1000 -> 1000 vnode.children->array类型

	SLOT_CHILDREN = 1 << 4, // 判断children是slot
}
