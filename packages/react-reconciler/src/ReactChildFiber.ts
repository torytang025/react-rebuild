import { logger } from "shared/logger";
import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import type { Props, ReactElement } from "shared/ReactTypes";

import {
	createFiberFromElement,
	createFiberFromText,
	createWorkInProgress,
	type FiberNode,
} from "./ReactFiber";
import { ChildDeletion, Placement } from "./ReactFiberFlags";
import { HostText } from "./ReactWorkTag";

export function createChildReconciler(shouldTrackSideEffects: boolean) {
	function deleteChild(returnFiber: FiberNode, childToDelete: FiberNode): void {
		if (!shouldTrackSideEffects) {
			return;
		}
		const deletions = returnFiber.deletions;
		if (deletions === null) {
			returnFiber.deletions = [childToDelete];
			returnFiber.flags |= ChildDeletion;
		} else {
			deletions.push(childToDelete);
		}
	}

	function useFiber(fiber: FiberNode, pendingProps: Props): FiberNode {
		const clone = createWorkInProgress(fiber, pendingProps);
		clone.index = 0;
		clone.sibling = null;
		return clone;
	}

	function placeSingleChild(newFiber: FiberNode) {
		// When a new fiber is created, it is placed into the work-in-progress tree.
		if (shouldTrackSideEffects && newFiber.alternate === null) {
			newFiber.flags |= Placement;
		}
		return newFiber;
	}

	function reconcileSingleElement(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		element: ReactElement,
	): FiberNode {
		const key = element.key;
		const child = currentFirstChild;
		if (child !== null) {
			if (child.key === key) {
				const elementType = element.type;
				if (child.type === elementType) {
					const existing = useFiber(child, element.props);
					existing.return = returnFiber;
					return existing;
				}
				deleteChild(returnFiber, child);
			} else {
				deleteChild(returnFiber, child);
			}
		}

		const fiber = createFiberFromElement(element);
		fiber.return = returnFiber;

		return fiber;
	}

	function reconcileSingleTextNode(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		content: string,
	): FiberNode {
		if (currentFirstChild !== null) {
			if (currentFirstChild.tag === HostText) {
				const existing = useFiber(currentFirstChild, content);
				existing.return = returnFiber;
				return existing;
			}
			deleteChild(returnFiber, currentFirstChild);
		}

		const fiber = createFiberFromText(content, null);
		fiber.return = returnFiber;

		return fiber;
	}

	function reconcileChildFiber(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		nextChild: ReactElement,
	) {
		if (typeof nextChild === "object" && nextChild !== null) {
			switch (nextChild.$$typeof) {
				case REACT_ELEMENT_TYPE:
					return placeSingleChild(
						reconcileSingleElement(returnFiber, currentFirstChild, nextChild),
					);

				default:
					return logger.error(
						"[ReactChildFiber] Invalid child type:",
						typeof nextChild,
					);
			}
		}

		// TODO Handle array children

		if (typeof nextChild === "string" || typeof nextChild === "number") {
			return placeSingleChild(
				reconcileSingleTextNode(returnFiber, currentFirstChild, nextChild),
			);
		}

		if (currentFirstChild) {
			deleteChild(returnFiber, currentFirstChild);
		}

		return null;
	}

	return reconcileChildFiber;
}

export const reconcileChildFibers = createChildReconciler(true);

export const mountChildFibers = createChildReconciler(false);
