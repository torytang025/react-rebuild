import { createWorkInProgress, FiberNode, FiberRootNode } from "./ReactFiber";
import { completeWork } from "./ReactFiberBeginWork";
import { beginWork } from "./ReactFiberCompleteWork";
import { HostRoot } from "./ReactWorkTag";

let workInProgress: FiberNode | null = null;

function prepareFreshStack(root: FiberRootNode) {
	workInProgress = createWorkInProgress(root.current, {});
}

export function scheduleUpdateOnFiber(fiber: FiberNode) {
	const fiberRoot = markUpdateFromFiberToRoot(fiber);
	renderRoot(fiberRoot);
}

/**
 * Traverses the fiber tree from the given fiber node to the root node.
 */
function markUpdateFromFiberToRoot(fiber: FiberNode) {
	let node: FiberNode | null = fiber;
	let parent: FiberNode | null = node.return;
	while (parent !== null) {
		node = parent;
		parent = node.return;
	}
	// if we reach the root node, return the stateNode
	// which is the fiberRoot
	if (node.tag === HostRoot) {
		return node.stateNode;
	}
	return null;
}

function renderRoot(root: FiberRootNode) {
	prepareFreshStack(root);

	do {
		try {
			workLoop();
		} catch (error) {
			console.error(
				"An error occurred while rendering the component tree: ",
				error,
			);
			workInProgress = null;
		}
		// eslint-disable-next-line no-constant-condition
	} while (true);
}

function workLoop() {
	while (workInProgress !== null) {
		performUnitOfWork(workInProgress);
	}
}

function performUnitOfWork(fiber: FiberNode) {
	const next = beginWork(fiber);
	fiber.memorizedProps = fiber.pendingProps;

	if (next !== null) {
		workInProgress = next;
	} else {
		completeUnitOfWork(fiber);
	}
}

function completeUnitOfWork(fiber: FiberNode) {
	let node: FiberNode | null = fiber;

	do {
		completeWork(node);

		const sibling = node.sibling;
		if (sibling !== null) {
			workInProgress = sibling;
			return;
		}
		node = node.return;
		workInProgress = node;
	} while (node !== null);
}
