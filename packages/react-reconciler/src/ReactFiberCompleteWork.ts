import {
	appendInitialChild,
	createInstance,
	createTextInstance,
	finalizeInitialChildren,
	type Instance,
} from "ReactFiberConfig";
import { logger } from "shared/logger";
import type { Props } from "shared/ReactTypes";

import type { Fiber } from "./ReactFiber";
import type { Flags } from "./ReactFiberFlags";
import { NoFlags, Update } from "./ReactFiberFlags";
import {
	Fragment,
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText,
} from "./ReactWorkTag";

function markUpdate(workInProgress: Fiber) {
	workInProgress.flags |= Update;
}

/**
 * Append all children of the current fiber node to the parent instance.
 */
function appendAllChildren(parent: Instance, workInProgress: Fiber) {
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

function updateHostComponent(
	current: Fiber,
	workInProgress: Fiber,
	type: string,
	newProps: Props,
) {
	const oldProps = current.memorizedProps;
	// TODO compare oldProps and newProps
	if (oldProps === newProps) {
		return;
	}
	markUpdate(workInProgress);
}

function updateHostText(
	current: Fiber,
	workInProgress: Fiber,
	oldText: string,
	newText: string,
) {
	if (oldText !== newText) {
		markUpdate(workInProgress);
	}
}

/**
 * Bubble all side-effects up to the parent fiber node.
 */
function bubbleProperties(completedWork: Fiber) {
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

export function completeWork(
	current: Fiber | null,
	workInProgress: Fiber,
): null {
	const newProps = workInProgress.pendingProps;
	const type = workInProgress.type;
	const tag = workInProgress.tag;

	logger.info("completeWork", tag, type);

	switch (tag) {
		case HostRoot:
		case FunctionComponent:
		case Fragment:
			bubbleProperties(workInProgress);
			return null;
		case HostComponent: {
			if (current !== null && workInProgress.stateNode) {
				// update the existing instance
				updateHostComponent(current, workInProgress, type, newProps);
			} else {
				// create a new instance
				const instance = createInstance(type, newProps, workInProgress);
				appendAllChildren(instance, workInProgress);
				workInProgress.stateNode = instance;
				if (finalizeInitialChildren(instance, type, newProps)) {
					markUpdate(workInProgress);
				}
			}
			bubbleProperties(workInProgress);
			return null;
		}
		case HostText: {
			const newText = newProps;
			if (current !== null && workInProgress.stateNode) {
				// update the existing instance
				const oldText = current.memorizedProps;
				updateHostText(current, workInProgress, oldText, newText);
			} else {
				// create a new instance
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
