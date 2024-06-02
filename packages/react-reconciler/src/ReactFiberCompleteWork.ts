import {
	appendInitialChild,
	createInstance,
	createTextInstance,
	type Instance,
} from "ReactFiberConfig";

import { logger } from "@/shared";

import type { FiberNode } from "./ReactFiber";
import type { Flags } from "./ReactFiberFlags";
import { NoFlags } from "./ReactFiberFlags";
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText,
} from "./ReactWorkTag";

export function completeWork(
	current: FiberNode | null,
	workInProgress: FiberNode,
): null {
	const newProps = workInProgress.pendingProps;
	const type = workInProgress.type;
	const tag = workInProgress.tag;

	logger.info("completeWork", tag, type);

	switch (tag) {
		case HostRoot:
		case FunctionComponent:
			bubbleProperties(workInProgress);
			return null;
		case HostComponent: {
			if (current !== null && workInProgress.stateNode) {
				// update the existing instance
			} else {
				const instance = createInstance(type, newProps);
				appendAllChildren(instance, workInProgress);
				workInProgress.stateNode = instance;
			}
			bubbleProperties(workInProgress);
			return null;
		}
		case HostText: {
			const newText = newProps;
			if (current !== null && workInProgress.stateNode) {
				// update the existing instance
			} else {
				const instance = createTextInstance(newText);
				workInProgress.stateNode = instance;
			}
			bubbleProperties(workInProgress);
			return null;
		}
		default:
			return logger.error(
				"[ReactCompleteWork] Unknown fiber tag: ",
				workInProgress.tag,
			);
	}
}

/**
 * Append all children of the current fiber node to the parent instance.
 */
function appendAllChildren(parent: Instance, workInProgress: FiberNode) {
	let node = workInProgress.child;

	while (node !== null) {
		if (node.tag === HostComponent || node.tag === HostText) {
			appendInitialChild(parent, node.stateNode);
		} else if (node.child !== null) {
			node.child.return = node;
			node = node.child;
			continue;
		}

		if (node === workInProgress) {
			return;
		}

		while (node.sibling === null) {
			if (node.return === null || node.return === workInProgress) {
				return;
			}
			node = node.return;
		}

		node.sibling.return = node.return;
		node = node.sibling;
	}
}

function bubbleProperties(completedWork: FiberNode) {
	let subtreeFlags = NoFlags;
	let child = completedWork.child;

	while (child !== null) {
		subtreeFlags |= child.subtreeFlags;
		subtreeFlags |= child.flags;

		child.return = completedWork;
		child = child.sibling;
	}

	completedWork.subtreeFlags |= subtreeFlags as Flags;
}
