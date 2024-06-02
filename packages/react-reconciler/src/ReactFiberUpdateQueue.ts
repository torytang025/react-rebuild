import type { Action, Update, UpdateQueue } from "@/shared";

export function createUpdate<State>(action: Action<State>): Update<State> {
	return {
		action,
	};
}

export function createUpdateQueue<State>(): UpdateQueue<State> {
	return {
		shared: {
			pending: null,
		},
	};
}

export function enqueueUpdate<State>(
	updateQueue: UpdateQueue<State>,
	update: Update<State>,
) {
	updateQueue.shared.pending = update;
}

export function processUpdateQueue<State>(
	baseState: State,
	pendingUpdate: Update<State> | null,
) {
	const result = {
		memorizedState: baseState,
	};

	if (pendingUpdate !== null) {
		const action = pendingUpdate.action;

		if (action instanceof Function) {
			result.memorizedState = action(baseState);
		} else {
			result.memorizedState = action;
		}
	}

	return result;
}
