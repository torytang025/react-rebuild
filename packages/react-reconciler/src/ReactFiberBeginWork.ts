import { mountChildFibers, reconcileChildFibers } from "./ReactChildFiber";
import type { FiberNode } from "./ReactFiber";
import { processUpdateQueue } from "./ReactFiberUpdateQueue";
import { HostComponent, HostRoot, HostText } from "./ReactWorkTag";

/**
 * beginWork is called by performUnitOfWork to begin the work on a fiber node.
 * There are mainly two things that happen in beginWork:
 * 1. compute the next state of the fiber node
 * 2. create child fibers for the fiber node
 */
export function beginWork(
	current: FiberNode | null,
	workInProgress: FiberNode,
) {
	switch (workInProgress.tag) {
		case HostRoot:
			return updateHostRoot(
				current,
				workInProgress as FiberNode<Element | null>,
			);

		case HostComponent:
			return updateHostComponent(current, workInProgress);

		case HostText:
			return updateHostText();

		default:
			if (import.meta.env.DEV) {
				console.error("Unknown fiber tag: ", workInProgress.tag);
			}
			break;
	}
	return null;
}

/**
 * updateHostRoot is called by beginWork to update the state of the root fiber node.
 * It processes the update queue and computes the next state of the root fiber node and creates child fibers.
 *
 * In the case of the root fiber node, the pending update is the element to render,
 * which is the element passed to ReactDOM.createRoot().render().
 */
function updateHostRoot(
	current: FiberNode | null,
	workInProgress: FiberNode<Element | null>,
) {
	// This is null for the first render pass.
	const baseSate = workInProgress.memorizedState;
	const updateQueue = workInProgress.updateQueue!;
	const pending = updateQueue.shared.pending;

	const { memorizedState } = processUpdateQueue(baseSate, pending);
	updateQueue.shared.pending = null;

	workInProgress.memorizedState = memorizedState;

	const nextChildren = workInProgress.memorizedState;
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
function updateHostComponent(
	current: FiberNode | null,
	workInProgress: FiberNode,
) {
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
	current: FiberNode | null,
	workInProgress: FiberNode<any>,
	nextChildren: any,
) {
	// If this is a new component that has never been rendered before, there is no current fiber.
	// For minimal side-effects, we only create child fibers but do not tag them with the Placement tag.
	// These children will be placed with the return fiber's Placement tag.
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
