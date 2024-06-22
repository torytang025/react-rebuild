import { logger } from "shared/logger";

import { mountChildFibers, reconcileChildFibers } from "./ReactChildFiber";
import type { Fiber } from "./ReactFiber";
import { renderWithHooks } from "./ReactFiberHooks";
import { processUpdateQueue } from "./ReactFiberUpdateQueue";
import {
	Fragment,
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText,
} from "./ReactWorkTag";

/**
 * beginWork is called by performUnitOfWork to begin the work on a fiber node.
 * There are mainly two things that happen in beginWork:
 * 1. compute the next state of the fiber node
 * 2. create child fibers for the fiber node
 */
export function beginWork(current: Fiber | null, workInProgress: Fiber) {
	logger.info("beginWork", workInProgress.tag, workInProgress.type);

	switch (workInProgress.tag) {
		case HostRoot:
			return updateHostRoot(current, workInProgress as Fiber<Element | null>);
		case FunctionComponent:
			return updateFunctionComponent(current, workInProgress);
		case HostComponent:
			return updateHostComponent(current, workInProgress);
		case HostText:
			return updateHostText();
		case Fragment:
			return updateFragment(current, workInProgress);

		default:
			return logger.error(
				"[ReactBeginWork] Unknown fiber tag: ",
				workInProgress.tag,
			);
	}
}

/**
 * updateHostRoot is called by beginWork to update the state of the root fiber node.
 * It processes the update queue and computes the next state of the root fiber node and creates child fibers.
 *
 * In the case of the root fiber node, the pending update is the element to render,
 * which is the element passed to ReactDOM.createRoot().render().
 */
function updateHostRoot(
	current: Fiber | null,
	workInProgress: Fiber<Element | null>,
) {
	// This is null for the first render pass.
	const baseSate = workInProgress.memorizedState;
	const updateQueue = workInProgress.updateQueue!;
	// fot host root, the pending update is the element to render
	const pending = updateQueue.shared.pending;

	const { memorizedState } = processUpdateQueue(baseSate, pending);
	updateQueue.shared.pending = null;

	workInProgress.memorizedState = memorizedState;

	const nextChildren = workInProgress.memorizedState;
	reconcileChildren(current, workInProgress, nextChildren);

	return workInProgress.child;
}

/**
 * Update the state of a function component fiber node.
 * The pending props of a function component fiber node is the props passed to the component.
 */
function updateFunctionComponent(current: Fiber | null, workInProgress: Fiber) {
	const Component = workInProgress.type;
	const pendingProps = workInProgress.pendingProps;
	const nextChildren = renderWithHooks(
		current,
		workInProgress,
		Component,
		pendingProps,
	);
	reconcileChildren(current, workInProgress, nextChildren);

	return workInProgress.child;
}

/**
 * Update the state of a fragment fiber node.
 * The pending props of a fragment fiber node is the children of the fragment.
 */
function updateFragment(current: Fiber | null, workInProgress: Fiber) {
	const nextChildren = workInProgress.pendingProps;
	reconcileChildren(current, workInProgress, nextChildren);
	return workInProgress.child;
}

/**
 * updateHostComponent is called by beginWork to update the state of a host component fiber node.
 * It computes the next state of the host component fiber node and creates child fibers.
 *
 * In the case of a host component fiber node, the pending update is the props passed to the component,
 * which is the props passed to the component in the render method, e.g. <div className="foo" />.
 *
 */
function updateHostComponent(current: Fiber | null, workInProgress: Fiber) {
	const nextProps = workInProgress.pendingProps;
	const nextChildren = nextProps.children;
	reconcileChildren(current, workInProgress, nextChildren);

	return workInProgress.child;
}

/**
 * updateHostText is called by beginWork to update the state of a host text fiber node.
 *
 * In the case of a host text fiber node, which represents a text node, leaf node in the fiber tree,
 * So there are no pending updates to process and no children to create.
 */
function updateHostText() {
	return null;
}

function reconcileChildren(
	current: Fiber | null,
	workInProgress: Fiber<any>,
	nextChildren: any,
) {
	// If this is a new component that has never been rendered before, there is no current fiber.
	// For minimal side-effects, we only create child fibers but do not tag them with the Placement tag.
	// These children will be placed with the return fiber's Placement tag.
	// Example:
	// <div> <-- only the div has the Placement tag, whose flag is equal to 1
	//	 <span>
	//		 Hello
	//  </span>
	//</div>
	if (current === null) {
		workInProgress.child = mountChildFibers(workInProgress, null, nextChildren);
	} else {
		// During the first render pass, only the root fiber has an alternate, which is the work-in-progress fiber created in prepareFreshStack.
		// After the first render pass, the current fiber is the fiber created in the previous render pass.
		workInProgress.child = reconcileChildFibers(
			workInProgress,
			current.child,
			nextChildren,
		);
	}
}
