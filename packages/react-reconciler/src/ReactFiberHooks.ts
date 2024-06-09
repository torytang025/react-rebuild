import { logger } from "shared/logger";
import ReactSharedInternals from "shared/ReactSharedInternals";
import type { Action, Component, Props, UpdateQueue } from "shared/ReactTypes";
import type {
	Dispatch,
	Dispatcher,
	InitialState,
	SetStateReturn,
} from "shared/ReactTypes";

import type { FiberNode } from "./ReactFiber";
import {
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
} from "./ReactFiberUpdateQueue";
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";

let currentlyRenderingFiber: FiberNode<any> | null = null;
let workInProgressHook: Hook<any, any> | null = null;

type Hook<S = unknown, T = unknown> = {
	memoizedState: S | null;
	queue: UpdateQueue<S> | null;

	next: Hook<T> | null;
};

export function renderWithHooks(
	current: FiberNode | null,
	workInProgress: FiberNode,
	Component: Component,
	props: Props,
) {
	currentlyRenderingFiber = workInProgress;
	workInProgress.memorizedState = null;

	// ReactSharedInternals.H =
	// 	current !== null
	// 		? // which means it's an update
	// 			HooksDispatcherOnUpdate
	// 		: // which means it's a mount
	// 			HooksDispatcherOnMount;

	if (current === null) {
		ReactSharedInternals.H = HooksDispatcherOnMount;
	}

	const children = Component(props);

	currentlyRenderingFiber = null;

	return children;
}

const mountWorkInProgressHook = <S>(): Hook<S> => {
	const hook: Hook<S> = {
		memoizedState: null,
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
		hook.memoizedState = initialState();
	} else {
		hook.memoizedState = initialState;
	}

	hook.queue = createUpdateQueue<S>();

	return hook;
};

const mountState = <S>(initialState: InitialState<S>): SetStateReturn<S> => {
	const hook = mountStateImpl(initialState);
	const queue = hook.queue!;
	const dispatch: Dispatch<S> = dispatchSetState.bind<
		null,
		[FiberNode<S>, UpdateQueue<S>],
		[Action<S>],
		void
	>(null, currentlyRenderingFiber!, queue);
	queue.dispatch = dispatch;

	return [hook.memoizedState!, dispatch];
};

// const updateState = <S>(initialState: InitialState<S>) => {};

const dispatchSetState = <S>(
	fiber: FiberNode<S>,
	queue: UpdateQueue<S>,
	action: Action<S>,
) => {
	const update = createUpdate(action);
	enqueueUpdate(queue, update);
	scheduleUpdateOnFiber(fiber);
};

const HooksDispatcherOnMount: Dispatcher = {
	useState: mountState,
};

// const HooksDispatcherOnUpdate: Dispatcher = {
// 	useState: updateState,
// };
