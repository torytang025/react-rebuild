import type { Fiber } from "react-reconciler/ReactFiber";
import { logger } from "shared/logger";

import { getFiberCurrentPropsFromNode } from "../client/ReactDOMComponent";
import type { DOMEventName } from "./DOMEventNames";
import { nonDelegatedEvents } from "./DOMEventNames";
import { allNativeEvents } from "./EventRegistry";
import type { EventSystemFlags } from "./EventSystemFlags";
import { IS_CAPTURE_PHASE } from "./EventSystemFlags";
import getEventTarget from "./getEventTarget";
import type { AnyNativeEvent } from "./PluginModuleType";
import * as SimpleEventPlugin from "./plugins/SimpleEventPlugin";
import { createEventListenerWrapperWithPriority } from "./ReactDOMEventListener";
import type { ReactSyntheticEvent } from "./ReactSyntheticEventType";

type DispatchListener = {
	listener: EventListener;
};

type DispatchEntry = {
	event: ReactSyntheticEvent;
	listeners: Array<DispatchListener>;
};

export type DispatchQueue = Array<DispatchEntry>;

SimpleEventPlugin.registerEvents();

function extractEvents(
	dispatchQueue: DispatchQueue,
	domEventName: DOMEventName,
	targetInst: null | Fiber,
	nativeEvent: AnyNativeEvent,
	nativeEventTarget: null | EventTarget,
	eventSystemFlags: EventSystemFlags,
	targetContainer: EventTarget,
): void {
	SimpleEventPlugin.extractEvents(
		dispatchQueue,
		domEventName,
		targetInst,
		nativeEvent,
		nativeEventTarget,
		eventSystemFlags,
		targetContainer,
	);
}

const listeningMarker = "_reactListening" + Math.random().toString(36).slice(2);

export function listenToAllSupportedEvents(
	rootContainerElement: EventTarget & {
		[key: string]: any;
	},
) {
	if (!rootContainerElement[listeningMarker]) {
		rootContainerElement[listeningMarker] = true;
		allNativeEvents.forEach((domEventName) => {
			if (!nonDelegatedEvents.has(domEventName)) {
				listenToNativeEvent(domEventName, false, rootContainerElement);
			}
			listenToNativeEvent(domEventName, true, rootContainerElement);
		});
	}
}

export function listenToNativeEvent(
	domEventName: DOMEventName,
	isCapturePhaseListener: boolean,
	target: EventTarget,
): void {
	let eventSystemFlags = 0;
	if (isCapturePhaseListener) {
		eventSystemFlags |= IS_CAPTURE_PHASE;
	}
	addTrappedEventListener(
		target,
		domEventName,
		eventSystemFlags,
		isCapturePhaseListener,
	);
}

function addTrappedEventListener(
	target: EventTarget,
	eventName: DOMEventName,
	flags: EventSystemFlags,
	isCapturePhaseListener: boolean,
): void {
	const listener = createEventListenerWrapperWithPriority(
		target,
		eventName,
		flags,
	);
	if (isCapturePhaseListener) {
		addEventCaptureListener(target, eventName, listener);
	} else {
		addEventBubbleListener(target, eventName, listener);
	}
}

export function addEventCaptureListener(
	target: EventTarget,
	eventType: string,
	listener: EventListener,
): EventListener {
	target.addEventListener(eventType, listener, true);
	return listener;
}

export function addEventBubbleListener(
	target: EventTarget,
	eventType: string,
	listener: EventListener,
): EventListener {
	target.addEventListener(eventType, listener, false);
	return listener;
}

export function dispatchEventForPluginEventSystem(
	domEventName: DOMEventName,
	eventSystemFlags: EventSystemFlags,
	nativeEvent: AnyNativeEvent,
	targetInst: Fiber | null,
	targetContainer: EventTarget,
): void {
	dispatchEventsForPlugins(
		domEventName,
		eventSystemFlags,
		nativeEvent,
		targetInst,
		targetContainer,
	);
}

function dispatchEventsForPlugins(
	domEventName: DOMEventName,
	eventSystemFlags: EventSystemFlags,
	nativeEvent: AnyNativeEvent,
	targetInst: Fiber | null,
	targetContainer: EventTarget,
) {
	const nativeEventTarget = getEventTarget(nativeEvent);
	const dispatchQueue: DispatchQueue = [];
	extractEvents(
		dispatchQueue,
		domEventName,
		targetInst,
		nativeEvent,
		nativeEventTarget,
		eventSystemFlags,
		targetContainer,
	);
	processDispatchQueue(dispatchQueue, eventSystemFlags);
}

function processDispatchQueue(
	dispatchQueue: DispatchQueue,
	eventSystemFlags: EventSystemFlags,
): void {
	const inCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0;
	for (let i = 0; i < dispatchQueue.length; i++) {
		const { event, listeners } = dispatchQueue[i];
		processDispatchQueueItemsInOrder(event, listeners, inCapturePhase);
	}
}

function processDispatchQueueItemsInOrder(
	event: ReactSyntheticEvent,
	dispatchListeners: Array<DispatchListener>,
	inCapturePhase: boolean,
): void {
	if (inCapturePhase) {
		// For capture phase, we process from the end to the beginning
		for (let i = dispatchListeners.length - 1; i >= 0; i--) {
			const { listener } = dispatchListeners[i];
			if (event.isPropagationStopped()) {
				return;
			}
			executeDispatch(event, listener);
		}
	} else {
		// For bubble phase, we process from the beginning to the end
		for (let i = 0; i < dispatchListeners.length; i++) {
			const { listener } = dispatchListeners[i];
			if (event.isPropagationStopped()) {
				return;
			}
			executeDispatch(event, listener);
		}
	}
}

function executeDispatch(
	event: ReactSyntheticEvent,
	listener: EventListener,
): void {
	try {
		// Since we simplify the event handling process, we don't process all the event properties.
		// @ts-expect-error
		listener(event);
	} catch (error) {
		logger.error("Error dispatching event", error);
	}
	event.currentTarget = null;
}

export function accumulateEventListeners(
	target: EventTarget,
	targetContainer: EventTarget,
	reactName: string | null,
	nativeEventType: string,
	inCapturePhase: boolean,
): DispatchListener[] {
	const listeners: DispatchListener[] = [];
	const captureName = reactName !== null ? reactName + "Capture" : null;
	const reactEventName = (
		inCapturePhase ? captureName : reactName
	) as DOMEventName;

	let currentTarget = target as Node | null;
	while (currentTarget && currentTarget !== targetContainer) {
		if (reactEventName === null) break;

		const props = getFiberCurrentPropsFromNode(currentTarget as Element);
		if (props === null) {
			return logger.error(
				"This is an internal error. Props should not be null.",
			);
		}

		if (props[reactEventName]) {
			const listener = props[reactEventName];
			listeners.push({ listener });
		}
		currentTarget = currentTarget.parentNode;
	}

	return listeners;
}
