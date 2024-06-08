import { logger } from "shared/logger";

import type { FiberNode } from "./ReactFiber";
import { createWorkInProgress } from "./ReactFiber";
import { beginWork } from "./ReactFiberBeginWork";
import { commitMutationEffects } from "./ReactFiberCommitWork";
import { completeWork } from "./ReactFiberCompleteWork";
import { MutationMask, NoFlags } from "./ReactFiberFlags";
import type { FiberRootNode } from "./ReactFiberRoot";
import { HostRoot } from "./ReactWorkTag";

let workInProgress: FiberNode | null = null;

/**
 * Prepares a fresh stack for the given root node, which is the entry point of the fiber tree.
 */
function prepareFreshStack(root: FiberRootNode) {
	workInProgress = createWorkInProgress(root.current, {});
}

export function scheduleUpdateOnFiber(fiber: FiberNode<any>) {
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

	return logger.error(
		"Failed to find the root node from the given fiber node.",
	);
}

/**
 * Begins the rendering process starting from the root node.
 * Prepares the fresh stack and enters the work loop.
 */
function renderRoot(root: FiberRootNode) {
	prepareFreshStack(root);

	do {
		try {
			workLoop();
			break;
		} catch (error) {
			workInProgress = null;
			return logger.error(
				"An error occurred while rendering the component tree: ",
				error,
			);
		}
		// eslint-disable-next-line no-constant-condition
	} while (true);

	const finishedWork = root.current.alternate;
	root.finishedWork = finishedWork;

	commitRoot(root);
}

function commitRoot(root: FiberRootNode) {
	const finishedWork = root.current.alternate;

	if (finishedWork === null) {
		return;
	}

	root.finishedWork = null;

	const subtreeHasEffects =
		(finishedWork.subtreeFlags & MutationMask) !== NoFlags;
	const rootHasEffects = (finishedWork.flags & MutationMask) !== NoFlags;

	if (subtreeHasEffects || rootHasEffects) {
		// Before mutation
		// Mutation
		commitMutationEffects(root, finishedWork);
		root.current = finishedWork;
		// Layout
	} else {
		root.current = finishedWork;
	}
}

function workLoop() {
	while (workInProgress !== null) {
		performUnitOfWork(workInProgress);
	}
}

function performUnitOfWork(unitOfWork: FiberNode) {
	const current = unitOfWork.alternate;
	const next = beginWork(current, unitOfWork);
	unitOfWork.memorizedProps = unitOfWork.pendingProps;

	if (next !== null) {
		workInProgress = next;
	} else {
		completeUnitOfWork(unitOfWork);
	}
}

function completeUnitOfWork(unitOfWork: FiberNode) {
	let completedWork: FiberNode | null = unitOfWork;

	do {
		const current = completedWork.alternate;
		completeWork(current, completedWork);

		const sibling = completedWork.sibling;
		if (sibling !== null) {
			workInProgress = sibling;
			return;
		}
		completedWork = completedWork.return;
		workInProgress = completedWork;
	} while (completedWork !== null);
}
