import { REACT_ELEMENT_TYPE, type ReactElement } from "shared";

import {
	createFiberFromElement,
	createFiberFromText,
	type FiberNode,
} from "./ReactFiber";
import { Placement } from "./ReactFiberFlags";

export function createChildReconciler(shouldTrackSideEffects: boolean) {
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
	) {
		const fiber = createFiberFromElement(element);
		fiber.return = returnFiber;

		return fiber;
	}

	function reconcileSingleTextNode(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		content: string,
	) {
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
					if (import.meta.env.DEV) {
						console.error("Invalid child type", nextChild);
					}
					break;
			}
		}

		// TODO Handle array children

		if (typeof nextChild === "string" || typeof nextChild === "number") {
			return placeSingleChild(
				reconcileSingleTextNode(returnFiber, currentFirstChild, nextChild),
			);
		}

		if (import.meta.env.DEV) {
			console.error("Invalid child type", nextChild);
		}
		return null;
	}

	return reconcileChildFiber;
}

export const reconcileChildFibers = createChildReconciler(true);

export const mountChildFibers = createChildReconciler(false);