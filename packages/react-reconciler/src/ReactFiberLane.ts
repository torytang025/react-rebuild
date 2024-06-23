import type { Fiber } from "./ReactFiber";
import type { FiberRoot } from "./ReactFiberRoot";

export type Lane = number;
export type Lanes = number;

export const NoLanes: Lanes = /*                        */ 0b0000000000000000000000000000000;
export const NoLane: Lane = /*                          */ 0b0000000000000000000000000000000;

export const SyncLane: Lane = /*                        */ 0b0000000000000000000000000000010;

export function mergeLanes(a: Lanes | Lane, b: Lanes | Lane): Lanes {
	return a | b;
}

export function requestUpdateLane<S>(fiber: Fiber<S>): Lane {
	// TODO Finish implementing this.
	return SyncLane;
}

export function getHighestPriorityLane(lanes: Lanes): Lane {
	return lanes & -lanes;
}

export function getNextLanes(root: FiberRoot): Lanes {
	const pendingLanes = root.pendingLanes;
	if (pendingLanes === NoLanes) {
		return NoLanes;
	}

	// TODO Finish implementing this for suspense.
	// For now we just return the highest priority lane.
	return getHighestPriorityLane(pendingLanes);
}

export function includesSomeLane(a: Lanes | Lane, b: Lanes | Lane) {
	return (a & b) !== NoLanes;
}

export function markRootFinished(root: FiberRoot, remainingLanes: Lanes) {
	root.pendingLanes &= ~remainingLanes;
}
