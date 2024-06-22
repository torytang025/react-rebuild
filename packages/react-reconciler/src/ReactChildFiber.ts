import isArray from "shared/isArray";
import { logger } from "shared/logger";
import { REACT_ELEMENT_TYPE, REACT_FRAGMENT_TYPE } from "shared/ReactSymbols";
import type {
	Key,
	Props,
	ReactElement,
	ReactFragment,
} from "shared/ReactTypes";

import type { FiberNode } from "./ReactFiber";
import {
	createFiberFromElement,
	createFiberFromFragment,
	createFiberFromText,
	createWorkInProgress,
} from "./ReactFiber";
import { ChildDeletion, Placement } from "./ReactFiberFlags";
import { Fragment, HostText } from "./ReactWorkTag";

type ExistintChildrenMap = Map<string | number | bigint, FiberNode>;

function throwOnInvalidObjectType(
	returnFiber: FiberNode,
	newChild: ReactElement,
) {
	const childString = Object.prototype.toString.call(newChild);

	return logger.error(
		`Objects are not valid as a React child (found: ${
			childString === "[object Object]"
				? "object with keys {" + Object.keys(newChild).join(", ") + "}"
				: childString
		}). ` +
			"If you meant to render a collection of children, use an array " +
			"instead.",
	);
}

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

	/**
	 * Collect the remaining old children into a map for reconciliation.
	 */
	function mapRemainingChildren(
		currentFirstChild: FiberNode,
	): ExistintChildrenMap {
		const existingChildren: ExistintChildrenMap = new Map();

		let existingChild: FiberNode | null = currentFirstChild;
		while (existingChild !== null) {
			if (existingChild.key != null) {
				existingChildren.set(existingChild.key, existingChild);
			} else {
				existingChildren.set(existingChild.index, existingChild);
			}
			existingChild = existingChild.sibling;
		}

		return existingChildren;
	}

	function placeChild(
		newFiber: FiberNode,
		lastPlacedIndex: number,
		newIndex: number,
	): number {
		// Update the index of the newFiber
		newFiber.index = newIndex;

		const current = newFiber.alternate;
		if (current !== null) {
			// Update
			const oldIndex = current.index;
			// We go through the newFiber's siblings from left to right, so
			// the newFiber is always the rightest sibling. If the oldIndex
			// is less than the lastPlacedIndex, it means this fiber was at the
			// left of the last placed fiber but now it is at the right of the
			// last placed fiber. In this case, we need to move it.
			if (oldIndex < lastPlacedIndex) {
				// !Limitation: we only support moving a fiber forward, not backward.
				// Say we have an old list [a, b, c, d], and a new list [d, a, b, c].
				// We will place d at the same place, and then we will place a, b, c.
				// We won't move d to the end and move a, b, c to the front.
				// So we have to move 3 times to place a, b, c instead of moving 1 time to place d.
				newFiber.flags |= Placement;
				return lastPlacedIndex;
			} else {
				// Order is preserved, stay in place
				return oldIndex;
			}
		} else {
			// Insert
			newFiber.flags |= Placement;
			return lastPlacedIndex;
		}
	}

	function placeSingleChild(newFiber: FiberNode) {
		// When a new fiber is created, it is placed into the work-in-progress tree.
		if (shouldTrackSideEffects && newFiber.alternate === null) {
			newFiber.flags |= Placement;
		}
		return newFiber;
	}

	function updateTextNode(
		returnFiber: FiberNode,
		current: FiberNode | null,
		textContent: string,
	): FiberNode {
		if (current === null || current.tag !== HostText) {
			// Insert
			const created = createFiberFromText(textContent);
			created.return = returnFiber;
			return created;
		} else {
			// Update
			const existing = useFiber(current, textContent);
			existing.return = returnFiber;
			return existing;
		}
	}

	function updateElement(
		returnFiber: FiberNode,
		current: FiberNode | null,
		element: ReactElement,
	): FiberNode {
		const elementType = element.type;

		if (elementType === REACT_FRAGMENT_TYPE) {
			const updated = updateFragment(
				returnFiber,
				current,
				element.props.children as ReactFragment,
				element.key,
			);
			return updated;
		}

		if (current !== null) {
			if (current.type === elementType) {
				// Update
				const existing = useFiber(current, element.props);
				existing.return = returnFiber;
				return existing;
			}
		}
		// Insert
		const created = createFiberFromElement(element);
		created.return = returnFiber;
		return created;
	}

	function updateFragment(
		returnFiber: FiberNode,
		current: FiberNode | null,
		fragment: ReactFragment,
		key: Key,
	): FiberNode {
		if (current === null || current.tag !== Fragment) {
			// Insert
			const newFiber = createFiberFromFragment(fragment, key);
			newFiber.return = returnFiber;

			return newFiber;
		} else {
			// Update
			const existing = useFiber(current, fragment);
			existing.return = returnFiber;

			return existing;
		}
	}

	function createChild(
		returnFiber: FiberNode,
		newChild: ReactElement,
	): FiberNode | null {
		if (
			(typeof newChild === "string" && newChild !== "") ||
			typeof newChild === "number" ||
			typeof newChild === "bigint"
		) {
			const newFiber = createFiberFromText("" + newChild);
			newFiber.return = returnFiber;
			return newFiber;
		}

		if (typeof newChild === "object" && newChild !== null) {
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE: {
					const newFiber = createFiberFromElement(newChild);
					newFiber.return = returnFiber;
					return newFiber;
				}
			}

			if (isArray(newChild)) {
				// For an array of children, we need to create a fragment fiber
				const newFiber = createFiberFromFragment(newChild, null);
				newFiber.return = returnFiber;
				return newFiber;
			}

			throwOnInvalidObjectType(returnFiber, newChild);
		}

		return null;
	}

	function updateSlot(
		returnFiber: FiberNode,
		oldFiber: FiberNode | null,
		newChild: ReactElement,
	): FiberNode | null {
		// if the key matches, we can reuse and update the oldFiber, otherwise return null
		const key = oldFiber === null ? null : oldFiber.key;

		// If the new child is a text node
		if (
			(typeof newChild === "string" && newChild !== "") ||
			typeof newChild === "number" ||
			typeof newChild === "bigint"
		) {
			// Since text nodes don't have keys, if the oldFiber is not null and the key is null, return null
			if (key !== null) {
				return null;
			}
			return updateTextNode(returnFiber, oldFiber, "" + newChild);
		}

		if (typeof newChild === "object" && newChild !== null) {
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE:
					if (key === newChild.key) {
						return updateElement(returnFiber, oldFiber, newChild);
					} else {
						return null;
					}
			}

			if (isArray(newChild)) {
				// Since array children don't have keys, if the oldFiber is not null and the key is null, return null
				if (key !== null) {
					return null;
				}

				const updated = updateFragment(returnFiber, oldFiber, newChild, null);
				return updated;
			}

			throwOnInvalidObjectType(returnFiber, newChild);
		}

		return null;
	}

	function updateFromMap(
		existingChildren: ExistintChildrenMap,
		returnFiber: FiberNode,
		newIdx: number,
		newChild: ReactElement,
	): FiberNode | null {
		if (
			(typeof newChild === "string" && newChild !== "") ||
			typeof newChild === "number" ||
			typeof newChild === "bigint"
		) {
			const matchedFiber = existingChildren.get(newIdx) || null;
			return updateTextNode(returnFiber, matchedFiber, "" + newChild);
		}

		if (typeof newChild === "object" && newChild !== null) {
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE: {
					const key = newChild.key;
					const matchedFiber =
						(key == null ? null : existingChildren.get(key)) || null;
					const updatedFiber = updateElement(
						returnFiber,
						matchedFiber,
						newChild,
					);
					return updatedFiber;
				}
			}

			if (isArray(newChild)) {
				const matchedFiber = existingChildren.get(newIdx) || null;
				const updated = updateFragment(
					returnFiber,
					matchedFiber,
					newChild,
					null,
				);
				return updated;
			}

			throwOnInvalidObjectType(returnFiber, newChild);
		}

		return null;
	}

	/**
	 * A core function in React reconciliation, which deals with an array of children.
	 */
	function reconcileChildrenArray(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		newChildren: Array<ReactElement>,
	) {
		// Let's break down the reconciliation process into four steps:
		// 1. Reconcile the children in the same order with the same key
		// 2. Delete the remaining old children when the new children are exhausted
		// 3. Create new fibers for the remaining new children when the old children are exhausted
		// 4. Reconcile the remaining children and clean up the old children
		//
		//
		//
		// ---------------------- Step 1 ----------------------
		// Step 1: Reconcile the children in the same order with the same key
		//
		// In this step, we should match the old children and the new children by their keys as well as their order as much as possible.
		// We loop through the old children and the new children at the same time.
		// If the old child and the new child have the same key, we reuse the old child.
		// Otherwise, we break the loop and move to the next step.

		let resultingFirstChild: FiberNode | null = null;
		let previousNewFiber: FiberNode | null = null;

		let oldFiber = currentFirstChild;
		let lastPlacedIndex = 0;
		let newIdx = 0;
		let nextOldFiber: FiberNode | null = null;
		for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
			// This happens when the new child is null or undefined, so the index is not successive.
			// For example: [ div, null, div ], the index of the second div is 2.
			// In this case, we need to break the loop and move to the next step.
			if (oldFiber.index > newIdx) {
				// Save the oldFiber for the next step
				nextOldFiber = oldFiber;
				// Set to null to break the loop
				oldFiber = null;
			} else {
				nextOldFiber = oldFiber.sibling;
			}

			const newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIdx]);

			if (newFiber === null) {
				// The new child didn't match the old child, so we need to break the loop and move to the next step.
				if (oldFiber === null) {
					// Reset the oldFiber to the nextOldFiber
					oldFiber = nextOldFiber;
				}
				break;
			}

			if (shouldTrackSideEffects) {
				// We didn't reuse the oldFiber, so we need to delete it.
				if (oldFiber && newFiber.alternate === null) {
					deleteChild(returnFiber, oldFiber);
				}
			}
			// Place the newFiber in the resulting tree and update the lastPlacedIndex
			lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
			// This happens the first time we place a child, so we need to set the resultingFirstChild
			if (previousNewFiber === null) {
				resultingFirstChild = newFiber;
			} else {
				// Connect the newFiber to the previousNewFiber
				previousNewFiber.sibling = newFiber;
			}
			// Prepare for the next loop
			previousNewFiber = newFiber;
			oldFiber = nextOldFiber;
		}

		// ---------------------- Step 2 ----------------------
		// Step 2: Delete the remaining old children when the new children are exhausted
		//
		// In this step, we need to delete the remaining old children, since the new children are exhausted and the remaining old children are useless.
		// For example: [div#a, div#b] -> [div#a] delete div#b
		if (newIdx === newChildren.length) {
			deleteRemainingChildren(returnFiber, oldFiber);
			return resultingFirstChild;
		}

		// ---------------------- Step 3 ----------------------
		// Step 3: Create new fibers for the remaining new children when the old children are exhausted
		//
		// In this step, we need to create new fibers for the remaining new children, since the old children are exhausted.
		// For example: [div#a] -> [div#a, div#b] create div#b
		if (oldFiber === null) {
			for (; newIdx < newChildren.length; newIdx++) {
				const newFiber = createChild(returnFiber, newChildren[newIdx]);
				if (newFiber === null) {
					continue;
				}
				lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
				if (previousNewFiber === null) {
					resultingFirstChild = newFiber;
				} else {
					previousNewFiber.sibling = newFiber;
				}
				previousNewFiber = newFiber;
			}

			return resultingFirstChild;
		}

		// ---------------------- Step 4 ----------------------
		// Step 4: Reconcile the remaining children and clean up the old children
		//
		// In this step, there are remaining old children and remaining new children.
		// We need to find the matching pairs and delete the remaining old children and create the remaining new children.
		// For example: [div#a, div#b] -> [div#b, div#c] delete div#a and create div#c

		const existingChildren = mapRemainingChildren(oldFiber);
		for (; newIdx < newChildren.length; newIdx++) {
			const newFiber = updateFromMap(
				existingChildren,
				returnFiber,
				newIdx,
				newChildren[newIdx],
			);
			if (newFiber === null) {
				continue;
			}
			if (shouldTrackSideEffects) {
				if (newFiber.alternate !== null) {
					// The newFiber is reused, so we need to delete it from the existingChildren map
					existingChildren.delete(
						newFiber.key == null ? newFiber.index : newFiber.key,
					);
				}
			}
			lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
			if (previousNewFiber === null) {
				resultingFirstChild = newFiber;
			} else {
				previousNewFiber.sibling = newFiber;
			}
			previousNewFiber = newFiber;
		}

		// Clean up the remaining old children
		if (shouldTrackSideEffects) {
			existingChildren.forEach((child) => deleteChild(returnFiber, child));
		}

		return resultingFirstChild;
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
				if (elementType === REACT_FRAGMENT_TYPE) {
					deleteRemainingChildren(returnFiber, child.sibling);

					// For fragments, the pending props is the children of the fragment
					const existing = useFiber(child, element.props.children);
					existing.return = returnFiber;

					return existing;
				} else if (child.type === elementType) {
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

		if (element.type === REACT_FRAGMENT_TYPE) {
			const newFiber = createFiberFromFragment(
				element.props.children as ReactFragment,
				element.key,
			);
			newFiber.return = returnFiber;

			return newFiber;
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

		const newFiber = createFiberFromText(content);
		newFiber.return = returnFiber;

		return newFiber;
	}

	function reconcileChildFibers(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		nextChild: ReactElement,
	) {
		const isUnkeyedTopLevelFragment =
			typeof nextChild === "object" &&
			nextChild !== null &&
			nextChild.type === REACT_FRAGMENT_TYPE &&
			nextChild.key === null;

		// If the top level fragment is unkeyed, we need to
		// unwrap it and work on its children. For example:
		// <div><><span /><span /></></div> -> <div /><span /><span /><div />
		if (isUnkeyedTopLevelFragment) {
			nextChild = nextChild.props.children;
		}

		if (typeof nextChild === "object" && nextChild !== null) {
			switch (nextChild.$$typeof) {
				case REACT_ELEMENT_TYPE:
					return placeSingleChild(
						reconcileSingleElement(returnFiber, currentFirstChild, nextChild),
					);
			}

			if (isArray(nextChild)) {
				const firstNewChild = reconcileChildrenArray(
					returnFiber,
					currentFirstChild,
					nextChild,
				);
				return firstNewChild;
			}

			return throwOnInvalidObjectType(returnFiber, nextChild);
		}

		if (typeof nextChild === "string" || typeof nextChild === "number") {
			return placeSingleChild(
				reconcileSingleTextNode(returnFiber, currentFirstChild, "" + nextChild),
			);
		}

		return deleteRemainingChildren(returnFiber, currentFirstChild);
	}

	return reconcileChildFibers;
}

export const reconcileChildFibers = createChildReconciler(true);

export const mountChildFibers = createChildReconciler(false);
