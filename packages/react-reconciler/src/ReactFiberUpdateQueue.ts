import { logger } from "shared/logger";
import type { Action, Update, UpdateQueue } from "shared/ReactTypes";

import type { Lane, Lanes } from "./ReactFiberLane";

export function createUpdate<State>(
	action: Action<State>,
	lane: Lane,
): Update<State> {
	return {
		action,
		lane,

		next: null,
	};
}

export function createUpdateQueue<State>(): UpdateQueue<State> {
	return {
		shared: {
			pending: null,
		},
		dispatch: null,
	};
}

export function enqueueUpdate<State>(
	updateQueue: UpdateQueue<State>,
	update: Update<State>,
) {
	const pending = updateQueue.shared.pending;

	// Link the update to the end of the circular list.
	// Example: If the list is [A, B, C] and the new update is D,
	// the circular list will be pending -> D -> A -> B -> C -> D
	if (pending === null) {
		// If there is no pending update, the update is the only one in the list.
		update.next = update;
	} else {
		update.next = pending.next;
		pending.next = update;
	}
	updateQueue.shared.pending = update;
}

/**
 * Processes all updates in the update queue with the same lane as the render lane.
 * The updates are processed in the order they were enqueued.
 */
export function processUpdateQueue<State>(
	baseState: State,
	pendingUpdate: Update<State> | null,
	renderLanes: Lanes,
) {
	const result = {
		memorizedState: baseState,
	};

	if (pendingUpdate !== null) {
		const firstPendingUpdate = pendingUpdate.next;
		let newBaseState = baseState;

		if (firstPendingUpdate !== null) {
			let pending: Update | null = firstPendingUpdate;
			// Iterate through the circular list of updates.
			do {
				const updateLane = pending!.lane;

				// If the update lane is the same as the render lane, apply the update.
				if (updateLane === renderLanes) {
					const action = pending!.action;

					if (action instanceof Function) {
						newBaseState = action(newBaseState);
					} else {
						newBaseState = action;
					}
				} else {
					return logger.error(
						"Cannot process update with different lane: ",
						updateLane,
					);
				}

				pending = pending!.next;
			} while (pending !== firstPendingUpdate);
		}

		result.memorizedState = newBaseState;
	}

	return result;
}
