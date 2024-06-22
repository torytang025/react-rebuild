import type { TextInstance } from "ReactFiberConfig";
import {
	commitTextUpdate,
	commitUpdate,
	insertBefore,
	removeChild,
	removeChildFromContainer,
} from "ReactFiberConfig";
import {
	appendChild,
	appendChildToContainer,
	type Container,
	type Instance,
} from "ReactFiberConfig";
import { logger } from "shared/logger";

import type { Fiber } from "./ReactFiber";
import { MutationMask, Placement, Update } from "./ReactFiberFlags";
import type { FiberRoot } from "./ReactFiberRoot";
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText,
} from "./ReactWorkTag";

export function commitMutationEffects(root: FiberRoot, finishedWork: Fiber) {
	commitMutationEffectsOnFiber(root, finishedWork);
}

function detachFiberMutation(fiber: Fiber) {
	const alternate = fiber.alternate;
	if (alternate !== null) {
		alternate.return = null;
	}
	fiber.return = null;
}

let hostParent: Instance | Container | null = null;
let hostParentIsContainer: boolean = false;

/**
 * Although we only need to delete the top fiber, we still need to traverse the fiber tree
 * to commit the unmount effects on the fiber nodes.
 * Firstly, we need to find the nearest host parent of the deleted fiber.
 */
function commitDeletionEffects(
	root: FiberRoot,
	returnFiber: Fiber,
	deletedFiber: Fiber,
): void {
	let parent: Fiber | null = returnFiber;
	findParent: while (parent !== null) {
		switch (parent.tag) {
			case HostRoot:
				hostParent = parent.stateNode.containerInfo;
				hostParentIsContainer = true;
				break findParent;
			case HostComponent:
				hostParent = parent.stateNode;
				hostParentIsContainer = false;
				break findParent;
		}
		parent = parent.return;
	}

	if (parent === null) {
		return logger.error(
			"Expected to find a host parent. This is an internal error.",
		);
	}
	commitDeletionEffectsOnFiber(root, returnFiber, deletedFiber);
	hostParent = null;
	hostParentIsContainer = false;

	detachFiberMutation(deletedFiber);
}

function recursivelyTraverseDeletionEffects(
	finishedRoot: FiberRoot,
	nearestMountedAncestor: Fiber,
	parent: Fiber,
) {
	let child = parent.child;
	while (child !== null) {
		commitDeletionEffectsOnFiber(finishedRoot, nearestMountedAncestor, child);
		child = child.sibling;
	}
}

function commitDeletionEffectsOnFiber(
	finishedRoot: FiberRoot,
	nearestMountedAncestor: Fiber,
	deletedFiber: Fiber,
): void {
	logger.info(
		"commitDeletionEffectsOnFiber",
		deletedFiber.tag,
		deletedFiber.type,
	);

	switch (deletedFiber.tag) {
		case HostComponent:
		case HostText: {
			const prevHostParent = hostParent;
			const preHostParentIsContainer = hostParentIsContainer;

			// Because we only need to delete the nearest host child, set host parent to null
			// to make sure the nested host nodes are not deleted.
			// Example:
			// <div>  <--- Delete the nearest host child
			//   <div>
			//     <div />
			//   </div>
			// <div />
			hostParent = null;

			recursivelyTraverseDeletionEffects(
				finishedRoot,
				nearestMountedAncestor,
				deletedFiber,
			);

			// After traversing all the children, we can put the host parent back to delete the nearest host child.
			hostParent = prevHostParent;
			hostParentIsContainer = preHostParentIsContainer;

			if (hostParent !== null) {
				if (hostParentIsContainer) {
					removeChildFromContainer(hostParent, deletedFiber.stateNode);
				} else {
					removeChild(hostParent, deletedFiber.stateNode);
				}
			}

			return;
		}
		case FunctionComponent: {
			// TODO clean up effects

			recursivelyTraverseDeletionEffects(
				finishedRoot,
				nearestMountedAncestor,
				deletedFiber,
			);
			return;
		}
		default: {
			recursivelyTraverseDeletionEffects(
				finishedRoot,
				nearestMountedAncestor,
				deletedFiber,
			);
			return;
		}
	}
}

function recursivelyTraverseMutationEffects(
	root: FiberRoot,
	parentFiber: Fiber,
) {
	// Deletions Effects can be scheduled on any fiber type.
	// And need to be fired before the effects on the children.
	const deletions = parentFiber.deletions;
	if (deletions !== null) {
		for (let i = 0; i < deletions.length; i++) {
			const childToDelete = deletions[i];
			try {
				commitDeletionEffects(root, parentFiber, childToDelete);
			} catch (err) {
				return logger.error("Error committing deletion", err);
			}
		}
	}

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
function commitMutationEffectsOnFiber(root: FiberRoot, finishedWork: Fiber) {
	const current = finishedWork.alternate;
	const flags = finishedWork.flags;

	switch (finishedWork.tag) {
		case FunctionComponent: {
			recursivelyTraverseMutationEffects(root, finishedWork);
			commitReconciliationEffects(finishedWork);
			return;
		}
		case HostComponent: {
			recursivelyTraverseMutationEffects(root, finishedWork);
			commitReconciliationEffects(finishedWork);

			if (flags & Update) {
				const instance = finishedWork.stateNode;
				const newProps = finishedWork.memorizedProps;
				const oldProps = current !== null ? current.memorizedProps : newProps;
				const type = finishedWork.type;
				try {
					commitUpdate(instance, type, oldProps, newProps);
				} catch (error) {
					return logger.error("Error committing HostComponent update", error);
				}
			}

			return;
		}
		case HostText: {
			recursivelyTraverseMutationEffects(root, finishedWork);
			commitReconciliationEffects(finishedWork);

			if (flags & Update) {
				const textInstance: TextInstance = finishedWork.stateNode;
				const newText: string = finishedWork.memorizedProps;
				const oldText: string =
					current !== null ? current.memorizedProps : newText;

				try {
					commitTextUpdate(textInstance, oldText, newText);
				} catch (err) {
					return logger.error("Error committing text update", err);
				}
			}

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

function commitReconciliationEffects(finishedWork: Fiber) {
	const flags = finishedWork.flags;

	// Placement can be scheduled on any fiber type.
	// And need to be fired after the children have been committed but before
	// the the effects on this fiber are committed.
	if (flags & Placement) {
		try {
			commitPlacement(finishedWork);
		} catch (err) {
			return logger.error("Error committing placement", err);
		}

		finishedWork.flags &= ~Placement;
	}
}

function isHostParent(fiber: Fiber) {
	return fiber.tag === HostComponent || fiber.tag === HostRoot;
}

function isHostNode(fiber: Fiber) {
	return fiber.tag === HostComponent || fiber.tag === HostText;
}

function getHostSibling(fiber: Fiber): Instance | null {
	let node: Fiber = fiber;

	// eslint-disable-next-line no-constant-condition
	siblings: while (true) {
		// If this node doesn't have a sibling, we need to traverse
		// its parent to find a host parent.
		while (node.sibling === null) {
			if (node.return === null || isHostParent(node.return)) {
				return null;
			}
			node = node.return;
		}

		node.sibling.return = node.return;
		node = node.sibling;

		// If this is not a host node, we need to traverse its children
		// to find a host node.
		while (!isHostNode(node)) {
			// This node is not a stable host node, so we need to traverse
			// its next sibling.
			if (node.flags & Placement) {
				continue siblings;
			}

			// We didn't find a host node till we reached
			// the end of the sibling list.
			if (node.child === null) {
				continue siblings;
			} else {
				node.child.return = node;
				node = node.child;
			}
		}

		if (!(node.flags & Placement)) {
			return node.stateNode;
		}
	}
}

/**
 * Get the host parent fiber of a fiber node.
 */
function getHostParentFiber(fiber: Fiber): Fiber {
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
function commitPlacement(finishedWork: Fiber) {
	const parentFiber = getHostParentFiber(finishedWork);

	switch (parentFiber.tag) {
		case HostComponent: {
			const parent: Instance = parentFiber.stateNode;
			const before = getHostSibling(finishedWork);
			insertOrAppendPlacementNode(finishedWork, parent, before);
			break;
		}
		case HostRoot: {
			const parent: Container = (parentFiber.stateNode as FiberRoot)
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
function insertOrAppendPlacementNode(
	node: Fiber,
	parent: Instance,
	before: Instance | null,
) {
	const isHost = isHostNode(node);
	if (isHost) {
		const stateNode = node.stateNode;
		if (before) {
			insertBefore(parent, stateNode, before);
		} else {
			appendChild(parent, stateNode);
		}
	} else {
		const child = node.child;
		if (child !== null) {
			insertOrAppendPlacementNode(child, parent, before);
			let sibling = child.sibling;
			while (sibling !== null) {
				insertOrAppendPlacementNode(sibling, parent, before);
				sibling = sibling.sibling;
			}
		}
	}
}

/**
 * Insert or append a fiber node to the container in the host environment.
 */
function insertOrAppendPlacementNodeIntoContainer(
	node: Fiber,
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
