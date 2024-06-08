import {
	appendChild,
	appendChildToContainer,
	type Container,
	type Instance,
} from "ReactFiberConfig";
import { logger } from "shared/logger";

import type { FiberNode } from "./ReactFiber";
import { MutationMask, Placement } from "./ReactFiberFlags";
import type { FiberRootNode } from "./ReactFiberRoot";
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText,
} from "./ReactWorkTag";

export function commitMutationEffects(
	root: FiberRootNode,
	finishedWork: FiberNode,
) {
	commitMutationEffectsOnFiber(root, finishedWork);
}

function recursivelyTraverseMutationEffects(
	root: FiberRootNode,
	parentFiber: FiberNode,
) {
	if (parentFiber.subtreeFlags & MutationMask) {
		let child = parentFiber.child;
		while (child !== null) {
			commitMutationEffectsOnFiber(root, child);
			child = child.sibling;
		}
	}
}

/**
 * Commit the mutation effects on a fiber node to the host environment by traversing the fiber tree.
 */
function commitMutationEffectsOnFiber(
	root: FiberRootNode,
	finishedWork: FiberNode,
) {
	switch (finishedWork.tag) {
		case FunctionComponent: {
			recursivelyTraverseMutationEffects(root, finishedWork);
			commitReconciliationEffects(finishedWork);
			return;
		}
		case HostComponent: {
			recursivelyTraverseMutationEffects(root, finishedWork);
			commitReconciliationEffects(finishedWork);
			return;
		}
		case HostText: {
			recursivelyTraverseMutationEffects(root, finishedWork);
			commitReconciliationEffects(finishedWork);
			return;
		}
		case HostRoot: {
			recursivelyTraverseMutationEffects(root, finishedWork);
			commitReconciliationEffects(finishedWork);
			return;
		}
		default: {
			recursivelyTraverseMutationEffects(root, finishedWork);
			commitReconciliationEffects(finishedWork);
			return;
		}
	}
}

function commitReconciliationEffects(finishedWork: FiberNode) {
	const flags = finishedWork.flags;

	if (flags & Placement) {
		logger.info("commitPlacement", finishedWork.type);

		commitPlacement(finishedWork);
		finishedWork.flags &= ~Placement;
	}
}

function isHostParent(fiber: FiberNode) {
	return fiber.tag === HostComponent || fiber.tag === HostRoot;
}

function isHostNode(fiber: FiberNode) {
	return fiber.tag === HostComponent || fiber.tag === HostText;
}

/**
 * Get the host parent fiber of a fiber node.
 */
function getHostParentFiber(fiber: FiberNode): FiberNode {
	let parent = fiber.return;
	while (parent !== null) {
		if (isHostParent(parent)) {
			return parent;
		} else {
			parent = parent.return;
		}
	}

	return logger.error("Expected to find a host parent.");
}

/**
 * Commit the placement of a fiber node to the host environment.
 */
function commitPlacement(finishedWork: FiberNode) {
	const parentFiber = getHostParentFiber(finishedWork);

	switch (parentFiber.tag) {
		case HostComponent: {
			const parent: Instance = parentFiber.stateNode;
			insertOrAppendPlacementNode(finishedWork, parent);
			break;
		}
		case HostRoot: {
			const parent: Container = (parentFiber.stateNode as FiberRootNode)
				.containerInfo;
			insertOrAppendPlacementNodeIntoContainer(finishedWork, parent);
			break;
		}
		default:
			return logger.error("Invalid host parent fiber", parentFiber.tag);
	}
}

/**
 * Insert or append a fiber node to the parent in the host environment.
 */
function insertOrAppendPlacementNode(node: FiberNode, parent: Instance) {
	const isHost = isHostNode(node);
	if (isHost) {
		const stateNode = node.stateNode;
		appendChild(parent, stateNode);
	} else {
		const child = node.child;
		if (child !== null) {
			insertOrAppendPlacementNode(child, parent);
			let sibling = child.sibling;
			while (sibling !== null) {
				insertOrAppendPlacementNode(sibling, parent);
				sibling = sibling.sibling;
			}
		}
	}
}

/**
 * Insert or append a fiber node to the container in the host environment.
 */
function insertOrAppendPlacementNodeIntoContainer(
	node: FiberNode,
	parent: Container,
) {
	const isHost = isHostNode(node);
	if (isHost) {
		const stateNode = node.stateNode;
		appendChildToContainer(parent, stateNode);
	} else {
		const child = node.child;
		if (child !== null) {
			insertOrAppendPlacementNodeIntoContainer(child, parent);
			let sibling = child.sibling;
			while (sibling !== null) {
				insertOrAppendPlacementNodeIntoContainer(sibling, parent);
				sibling = sibling.sibling;
			}
		}
	}
}
