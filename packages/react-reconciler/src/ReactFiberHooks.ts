import type { Component, Props } from "@/shared";

import type { FiberNode } from "./ReactFiber";

export function renderWithHooks(
	current: FiberNode | null,
	workInProgress: FiberNode,
	Component: Component,
	props: Props,
) {
	const children = Component(props);

	return children;
}
