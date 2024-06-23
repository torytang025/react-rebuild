import { scheduleMicrotask, supportsMicrotasks } from "ReactFiberConfig";
import { logger } from "shared/logger";

import type { Fiber } from "./ReactFiber";
import { createWorkInProgress } from "./ReactFiber";
import { beginWork } from "./ReactFiberBeginWork";
import { commitMutationEffects } from "./ReactFiberCommitWork";
import { completeWork } from "./ReactFiberCompleteWork";
import { MutationMask, NoFlags } from "./ReactFiberFlags";
import {
	getHighestPriorityLane,
	getNextLanes,
	includesSomeLane,
	type Lane,
	type Lanes,
	markRootFinished,
	mergeLanes,
	NoLanes,
	SyncLane,
} from "./ReactFiberLane";
import type { FiberRoot } from "./ReactFiberRoot";
import { flushSyncCallbacks, scheduleSyncCallback } from "./ReactSyncTaskQueue";
import { HostRoot } from "./ReactWorkTag";

let workInProgress: Fiber | null = null;
let workInProgressRootRenderLanes: Lanes = NoLanes;

/**
 * Prepares a fresh stack for the given root node, which is the entry point of the fiber tree.
 */
function prepareFreshStack(root: FiberRoot, lanes: Lanes) {
	root.finishedLanes = NoLanes;
	root.finishedWork = null;

	const rootWorkInProgress = createWorkInProgress(root.current, {});
	workInProgress = rootWorkInProgress;
	workInProgressRootRenderLanes = lanes;
}

export function scheduleUpdateOnFiber(fiber: Fiber<any>, lane: Lane) {
	const fiberRoot = markUpdateFromFiberToRoot(fiber);
	markRootUpdated(fiberRoot, lane);

	ensureRootIsScheduled(fiberRoot);
}

/**
 * Schedules the root node for rendering with the given lanes.
 */
function ensureRootIsScheduled(root: FiberRoot) {
	const nextLanes = getNextLanes(root);

	// If there are no lanes to work on, return.
	if (nextLanes === NoLanes) {
		return;
	}

	// Get the highest priority lane to schedule the callback.
	const newCallbackPriority = getHighestPriorityLane(nextLanes);

	if (newCallbackPriority === SyncLane) {
		// Schedule a sync callback.
		scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
		if (supportsMicrotasks) {
			// Flush the sync callbacks in a microtask.
			scheduleMicrotask(flushSyncCallbacks);
		}
	} else {
		// TODO Implement this
	}
}

/**
 * Marks the root node as updated with the given lanes.
 */
function markRootUpdated(root: FiberRoot, updatedLanes: Lanes) {
	root.pendingLanes = mergeLanes(root.pendingLanes, updatedLanes);
}

/**
 * Traverses the fiber tree from the given fiber node to the root node.
 */
function markUpdateFromFiberToRoot(fiber: Fiber): FiberRoot {
	let node: Fiber | null = fiber;
	let parent: Fiber | null = node.return;
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
 * Performs the synchronous work on the root node.
 */
function performSyncWorkOnRoot(root: FiberRoot) {
	const lanes = getNextLanes(root);

	// If there are no sync lanes to work on, return.
	if (!includesSomeLane(lanes, SyncLane)) {
		ensureRootIsScheduled(root);
		return;
	}

	renderRootSync(root, lanes);

	const finishedWork = root.current.alternate;
	root.finishedWork = finishedWork;
	root.finishedLanes = lanes;

	commitRoot(root);
}

/**
 * Begins the rendering process starting from the root node.
 * Prepares the fresh stack and enters the work loop.
 */
function renderRootSync(root: FiberRoot, lanes: Lanes) {
	logger.info("===== Begin rendering the root node synchronously. =====");

	// If the lanes are different from the current lanes, prepare a fresh stack.
	if (workInProgressRootRenderLanes !== lanes) {
		prepareFreshStack(root, lanes);
	}

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

	workInProgressRootRenderLanes = NoLanes;
}

function commitRoot(root: FiberRoot) {
	logger.info("===== Begin committing the root node. =====");

	const finishedWork = root.current.alternate;

	if (finishedWork === null) {
		return;
	}

	const lanes = root.finishedLanes;
	if (lanes === NoLanes) {
		logger.warn("Should not have an empty lanes. This is an inner error.");
	}

	// Reset the root.
	root.finishedWork = null;
	root.finishedLanes = NoLanes;

	// Lanes have been scheduled. Remove them from the root.
	markRootFinished(root, lanes);

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

function performUnitOfWork(unitOfWork: Fiber) {
	const current = unitOfWork.alternate;
	const next = beginWork(current, unitOfWork, workInProgressRootRenderLanes);
	unitOfWork.memorizedProps = unitOfWork.pendingProps;

	if (next !== null) {
		workInProgress = next;
	} else {
		completeUnitOfWork(unitOfWork);
	}
}

function completeUnitOfWork(unitOfWork: Fiber) {
	let completedWork: Fiber | null = unitOfWork;

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
