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

	function deleteRemainingChildren(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
	): null {
		if (!shouldTrackSideEffects) {
			return null;
		}

		let childToDelete = currentFirstChild;
		while (childToDelete !== null) {
			deleteChild(returnFiber, childToDelete);
			childToDelete = childToDelete.sibling;
		}

		return null;
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

	/**
	 * Deals with a single child, either reuse or new.
	 * @example
	 * ``` tsx
	 * <div key="foo" /> <div key="bar" /> -> <div key="foo" />
	 * <div key="foo" /> <div key="bar" /> -> <span key="foo" />
	 * <div key="foo" />  -> <span key="foo" />
	 * ```
	 */
	function reconcileSingleElement(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		element: ReactElement,
	): FiberNode {
		const key = element.key;
		let child = currentFirstChild;
		while (child !== null) {
			if (child.key === key) {
				const elementType = element.type;
				if (child.type === elementType) {
					// key and type match, which means the fiber can be reused and all the other children can be deleted
					// For example: <div key="foo" /> <div key="bar" /> -> <div key="foo" />

					// First, delete the remaining children
					deleteRemainingChildren(returnFiber, child.sibling);

					// Then, reuse the existing fiber
					// For example: <div key="foo" /> -> <div key="foo" />
					const existing = useFiber(child, element.props);
					existing.return = returnFiber;

					return existing;
				}

				// key matches but the type doesn't, which means all the children need to be deleted
				// For example: <div key="foo" /> <div key="bar" /> -> <span key="foo" />
				deleteRemainingChildren(returnFiber, child);
				// After deleting the remaining children, break the loop since all the children have been deleted
				break;
			} else {
				// key doesn't match, delete the old child and continue to the next child
				deleteChild(returnFiber, child);
			}
			child = child.sibling;
		}

		// If fallback to this point, it means the element is new and needs to be created
		const newFiber = createFiberFromElement(element);
		newFiber.return = returnFiber;

		return newFiber;
	}

	/**
	 * Deals with a single text node, either reuse or new.
	 * @example
	 * ``` tsx
	 * <div>foo</div> -> <div>foo</div>
	 * <div>foo</div> -> <div>bar</div>
	 * <div><span /></div> -> <div>foo</div>
	 */
	function reconcileSingleTextNode(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		content: string,
	): FiberNode {
		// Since there is no key for text nodes, we only need to check if the current child is a text node
		if (currentFirstChild !== null && currentFirstChild.tag === HostText) {
			// Same as the case for elements, if the current child is a text node, reuse it and delete the remaining children
			deleteRemainingChildren(returnFiber, currentFirstChild.sibling);
			const existing = useFiber(currentFirstChild, content);
			existing.return = returnFiber;
			return existing;
		}

		// If fallback to this point, it means the current child is not a text node, so delete the current child and create a new text node
		deleteRemainingChildren(returnFiber, currentFirstChild);

		const newFiber = createFiberFromText(content, null);
		newFiber.return = returnFiber;

		return newFiber;
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
