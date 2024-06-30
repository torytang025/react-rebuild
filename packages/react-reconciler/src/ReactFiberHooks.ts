import { logger } from "shared/logger";
import ReactSharedInternals from "shared/ReactSharedInternals";
import type {
	Action,
	Component,
	DependencyList,
	Destroy,
	Effect,
	EffectCallback,
	Props,
	UpdateQueue,
} from "shared/ReactTypes";
import type {
	Dispatch,
	Dispatcher,
	InitialState,
	SetStateReturn,
} from "shared/ReactTypes";

import type { Fiber } from "./ReactFiber";
import { type Flags, Passive } from "./ReactFiberFlags";
import type { Lanes } from "./ReactFiberLane";
import { NoLanes, requestUpdateLane } from "./ReactFiberLane";
import {
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
	processUpdateQueue,
} from "./ReactFiberUpdateQueue";
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";
import {
	HasEffect,
	type HookFlags,
	PassiveEffect,
} from "./ReactHookEffectTags";

type Hook<S = unknown, T = unknown> = {
	memorizedState: S | null;
	queue: UpdateQueue<S> | null;

	next: Hook<T> | null;
};

let renderLanes: Lanes = NoLanes;

let currentlyRenderingFiber: Fiber<any> | null = null;
let currentHook: Hook<any, any> | null = null;
let workInProgressHook: Hook<any, any> | null = null;

function warnOnBreakingHooksRule() {
	return logger.error(
		"You are breaking the rule of hooks. Hooks can only be called inside the body of a function component.",
	);
}

function areHookInputsEqual(
	nextDeps: DependencyList | null,
	prevDeps: DependencyList | null,
) {
	if (prevDeps === null || nextDeps === null) {
		return false;
	}

	for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
		if (Object.is(nextDeps[i], prevDeps[i])) {
			continue;
		}
		return false;
	}

	return true;
}

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
	// Reset the updateQueue, where the effects will be stored, to null
	workInProgress.updateQueue = null;

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

function mountWorkInProgressHook<S>(): Hook<S> {
	const hook: Hook<S> = {
		memorizedState: null,
		queue: null,

		next: null,
	};

	// This is the first hook in the list
	if (workInProgressHook === null) {
		if (currentlyRenderingFiber === null) {
			return warnOnBreakingHooksRule();
		}
		// store the first hook in the fiber
		currentlyRenderingFiber.memorizedState = workInProgressHook = hook;
	} else {
		// Append to the end of the list
		workInProgressHook = workInProgressHook.next = hook;
	}

	return workInProgressHook as Hook<S>;
}

function mountStateImpl<S>(initialState: InitialState<S>): Hook<S> {
	const hook = mountWorkInProgressHook<S>();

	if (initialState instanceof Function) {
		hook.memorizedState = initialState();
	} else {
		hook.memorizedState = initialState;
	}

	hook.queue = createUpdateQueue<S>();

	return hook;
}

function mountState<S>(initialState: InitialState<S>): SetStateReturn<S> {
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
}

/**
 * Create a update queue for the fiber which stores the effects.
 * Then append a new effect to the end of the list and
 * link the effects together with a circular linked list.
 */
function pushEffect(
	tag: HookFlags,
	create: () => (() => void) | void,
	destroy?: Destroy,
	deps?: DependencyList,
): Effect {
	if (currentlyRenderingFiber === null) {
		return warnOnBreakingHooksRule();
	}

	const effect: Effect = {
		tag,
		create,
		destroy,
		deps,

		// Form a circular linked list
		next: null,
	};

	const componentUpdateQueue = currentlyRenderingFiber.updateQueue;
	// This is the first effect in the list
	if (componentUpdateQueue === null) {
		const newQueue = createUpdateQueue();
		currentlyRenderingFiber.updateQueue = newQueue;
		effect.next = effect;
		newQueue.lastEffect = effect;
	} else {
		const lastEffect = componentUpdateQueue.lastEffect;
		if (lastEffect === null) {
			componentUpdateQueue.lastEffect = effect.next = effect;
		} else {
			effect.next = lastEffect.next;
			lastEffect.next = effect;
			componentUpdateQueue.lastEffect = effect;
		}
	}

	return effect;
}

function mountEffectImpl(
	flags: Flags,
	hookFlags: HookFlags,
	create: EffectCallback,
	deps?: DependencyList,
) {
	if (currentlyRenderingFiber === null) {
		return warnOnBreakingHooksRule();
	}

	const hook = mountWorkInProgressHook();
	// Set the flags to indicate that this fiber should commit the effect
	currentlyRenderingFiber.flags |= flags;
	// Link all the effects together
	hook.memorizedState = pushEffect(
		// Should fire the effect during the mount phase
		HasEffect | hookFlags,
		create,
		// There is no destroy function during the mount phase
		undefined,
		deps,
	);
}

function mountEffect(create: EffectCallback, deps?: DependencyList): void {
	return mountEffectImpl(
		// Add the Passive flag to indicate that this fiber
		// should commit the Passive effect during the commit phase
		Passive,
		PassiveEffect,
		create,
		deps,
	);
}

/**
 * update a new hook in the work-in-progress fiber
 * @example
 * mount: [hook1] -> [hook2] -> [hook3]
 * update: [hook1] -> [hook2] -> [hook3]
 */
function updateWorkInProgressHook<S>(): Hook<S> {
	if (currentlyRenderingFiber === null) {
		return warnOnBreakingHooksRule();
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
		// This is a error case, which means hooks are called conditionally
		// This leads to the wrong state of hooks
		// So that's why React has a rule that hooks should be called in the same order
		if (nextCurrentHook === null) {
			const current = currentlyRenderingFiber.alternate;
			if (current === null) {
				return logger.error(
					"Call update during the initial render. This is an internal error.",
				);
			} else {
				return logger.error(
					"The number of hooks in this component is not the same as the previous render." +
						"This happens when a hook is called conditionally.",
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
}

function updateStateImpl<S>(): SetStateReturn<S> {
	const hook = updateWorkInProgressHook<S>();
	const queue = hook.queue;

	if (queue === null) {
		return logger.error(
			"Should have a queue. You are likely calling Hooks conditionally.",
		);
	}

	const baseSate = hook.memorizedState!;
	const pendingUpdate = queue.pending;
	// Clear the pending update
	queue.pending = null;

	const dispatch = queue.dispatch!;

	const { memorizedState } = processUpdateQueue(
		baseSate,
		pendingUpdate,
		renderLanes,
	);
	hook.memorizedState = memorizedState;

	return [hook.memorizedState, dispatch];
}

function updateState<S>(): SetStateReturn<S> {
	return updateStateImpl();
}

function dispatchSetState<S>(
	fiber: Fiber<S>,
	queue: UpdateQueue<S>,
	action: Action<S>,
) {
	const lane = requestUpdateLane(fiber);
	const update = createUpdate(action, lane);
	enqueueUpdate(queue, update);
	scheduleUpdateOnFiber(fiber, lane);
}

function updateEffectImpl(
	fiberFlags: Flags,
	hookFlags: HookFlags,
	create: EffectCallback,
	deps?: DependencyList,
) {
	if (currentlyRenderingFiber === null) {
		return warnOnBreakingHooksRule();
	}

	const hook = updateWorkInProgressHook();
	const nextDeps = deps === undefined ? null : deps;
	let destroy: Destroy = undefined;

	if (currentHook !== null) {
		const prevEffect = currentHook.memorizedState as Effect | null;
		// Copy the destroy function from the previous effect
		destroy = prevEffect?.destroy;
		if (prevEffect !== null) {
			const prevDeps = prevEffect.deps || null;
			// If the dependencies are the same, we can push the effect
			// without firing the effect. This fits the our instinct
			// that the effect should be fired when the dependencies change
			if (areHookInputsEqual(nextDeps, prevDeps)) {
				hook.memorizedState = pushEffect(hookFlags, create, destroy, deps);
				return;
			}
		}
	}

	currentlyRenderingFiber.flags |= fiberFlags;

	hook.memorizedState = pushEffect(
		// Should fire the effect during the update phase
		// since the dependencies have changed
		HasEffect | hookFlags,
		create,
		destroy,
		deps,
	);
}

function updateEffect(create: EffectCallback, deps?: DependencyList) {
	updateEffectImpl(Passive, PassiveEffect, create, deps);
}

/**
 * The dispatcher for hooks during the mount phase
 */
const HooksDispatcherOnMount: Dispatcher = {
	useState: mountState,
	useEffect: mountEffect,
};

/**
 * The dispatcher for hooks during the update phase
 */
const HooksDispatcherOnUpdate: Dispatcher = {
	useState: updateState,
	useEffect: updateEffect,
};
