import { logger } from "shared/logger";
import ReactSharedInternals from "shared/ReactSharedInternals";
import type { Action, Component, Props, UpdateQueue } from "shared/ReactTypes";
import type {
	Dispatch,
	Dispatcher,
	InitialState,
	SetStateReturn,
} from "shared/ReactTypes";

import type { Fiber } from "./ReactFiber";
import type { Lanes } from "./ReactFiberLane";
import { NoLanes, requestUpdateLane } from "./ReactFiberLane";
import {
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
	processUpdateQueue,
} from "./ReactFiberUpdateQueue";
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";

type Hook<S = unknown, T = unknown> = {
	memorizedState: S | null;
	queue: UpdateQueue<S> | null;

	next: Hook<T> | null;
};

let renderLanes: Lanes = NoLanes;

let currentlyRenderingFiber: Fiber<any> | null = null;
let currentHook: Hook<any, any> | null = null;
let workInProgressHook: Hook<any, any> | null = null;

export function renderWithHooks(
	current: Fiber | null,
	workInProgress: Fiber,
	Component: Component,
	props: Props,
	nextRenderLanes: Lanes,
) {
	renderLanes = nextRenderLanes;
	currentlyRenderingFiber = workInProgress;
	// Reset the memorizedState, where the hooks will be stored, to null
	// to indicate that it's a new hook list
	workInProgress.memorizedState = null;

	ReactSharedInternals.H =
		current !== null
			? // which means it's an update
				HooksDispatcherOnUpdate
			: // which means it's a mount
				HooksDispatcherOnMount;

	const children = Component(props);

	finishRenderingHooks();
	return children;
}

function finishRenderingHooks() {
	currentlyRenderingFiber = null;
	currentHook = null;
	workInProgressHook = null;
	renderLanes = NoLanes;
}

const mountWorkInProgressHook = <S>(): Hook<S> => {
	const hook: Hook<S> = {
		memorizedState: null,
		queue: null,
		next: null,
	};

	// This is the first hook in the list
	if (workInProgressHook === null) {
		if (currentlyRenderingFiber === null) {
			return logger.error(
				"[mountWorkInProgressHook] Hooks can only be called inside the body of a function component.",
			);
		}
		// store the first hook in the fiber
		currentlyRenderingFiber.memorizedState = workInProgressHook = hook;
	} else {
		// Append to the end of the list
		workInProgressHook = workInProgressHook.next = hook;
	}

	return workInProgressHook as Hook<S>;
};

const mountStateImpl = <S>(initialState: InitialState<S>): Hook<S> => {
	const hook = mountWorkInProgressHook<S>();

	if (initialState instanceof Function) {
		hook.memorizedState = initialState();
	} else {
		hook.memorizedState = initialState;
	}

	hook.queue = createUpdateQueue<S>();

	return hook;
};

const mountState = <S>(initialState: InitialState<S>): SetStateReturn<S> => {
	const hook = mountStateImpl(initialState);
	const queue = hook.queue!;
	const dispatch: Dispatch<S> = dispatchSetState.bind<
		null,
		[Fiber<S>, UpdateQueue<S>],
		[Action<S>],
		void
	>(null, currentlyRenderingFiber!, queue);
	queue.dispatch = dispatch;

	return [hook.memorizedState!, dispatch];
};

/**
 * update a new hook in the work-in-progress fiber
 * @example
 * mount: [hook1] -> [hook2] -> [hook3]
 * update: [hook1] -> [hook2] -> [hook3]
 */
const updateWorkInProgressHook = <S>(): Hook<S> => {
	if (currentlyRenderingFiber === null) {
		return logger.error(
			"Hooks can only be called inside the body of a function component.",
		);
	}

	let nextCurrentHook: Hook<S> | null = null;
	// This is the first hook in the list
	if (currentHook === null) {
		const current = currentlyRenderingFiber.alternate;
		if (current !== null) {
			nextCurrentHook = current.memorizedState as Hook<S>;
		} else {
			// Current should not be null during the update phase
			// This is a error case, will be handled in the following code
			nextCurrentHook = null;
		}
	} else {
		nextCurrentHook = currentHook.next;
	}

	let nextWorkInProgressHook: Hook<S> | null = null;
	if (workInProgressHook === null) {
		nextWorkInProgressHook = currentlyRenderingFiber.memorizedState;
	} else {
		nextWorkInProgressHook = workInProgressHook.next;
	}

	if (nextWorkInProgressHook !== null) {
		workInProgressHook = nextWorkInProgressHook;
		nextWorkInProgressHook = workInProgressHook.next;

		currentHook = nextCurrentHook;
	} else {
		// mount: [hook1] -> [hook2] -> [hook3]
		// update: [hook1] -> [hook2] -> [hook3] -> [hook4]
		if (nextCurrentHook === null) {
			const current = currentlyRenderingFiber.alternate;
			if (current === null) {
				return logger.error(
					"Call update during the initial render. This is an internal error.",
				);
			} else {
				return logger.error(
					"The number of hooks in this component is not the same as the previous render.",
				);
			}
		}

		currentHook = nextCurrentHook;

		const newHook: Hook<S> = {
			memorizedState: currentHook.memorizedState,

			queue: currentHook.queue,

			next: null,
		};

		// This is the first hook in the list
		if (workInProgressHook === null) {
			// store the first hook in the fiber
			currentlyRenderingFiber.memorizedState = workInProgressHook = newHook;
		} else {
			// Append to the end of the list
			workInProgressHook = workInProgressHook.next = newHook;
		}
	}

	return workInProgressHook as Hook<S>;
};

const updateStateImpl = <S>(): SetStateReturn<S> => {
	const hook = updateWorkInProgressHook<S>();
	const queue = hook.queue;

	if (queue === null) {
		return logger.error(
			"Should have a queue. You are likely calling Hooks conditionally.",
		);
	}

	const baseSate = hook.memorizedState!;
	const pendingUpdate = queue.shared.pending;
	const dispatch = queue.dispatch!;

	const { memorizedState } = processUpdateQueue(
		baseSate,
		pendingUpdate,
		renderLanes,
	);
	hook.memorizedState = memorizedState;

	return [hook.memorizedState, dispatch];
};

const updateState = <S>(): SetStateReturn<S> => {
	return updateStateImpl();
};

const dispatchSetState = <S>(
	fiber: Fiber<S>,
	queue: UpdateQueue<S>,
	action: Action<S>,
) => {
	const lane = requestUpdateLane(fiber);
	const update = createUpdate(action, lane);
	enqueueUpdate(queue, update);
	scheduleUpdateOnFiber(fiber, lane);
};

/**
 * The dispatcher for hooks during the mount phase
 */
const HooksDispatcherOnMount: Dispatcher = {
	useState: mountState,
};

/**
 * The dispatcher for hooks during the update phase
 */
const HooksDispatcherOnUpdate: Dispatcher = {
	useState: updateState,
};
