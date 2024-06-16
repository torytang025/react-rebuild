import { logger } from "shared/logger";

import type { DOMEventName } from "./DOMEventNames";
import { dispatchEventForPluginEventSystem } from "./DOMPluginEventSystem";
import type { EventSystemFlags } from "./EventSystemFlags";
import type { AnyNativeEvent } from "./PluginModuleType";

export function createEventListenerWrapperWithPriority(
	targetContainer: EventTarget,
	domEventName: DOMEventName,
	eventSystemFlags: EventSystemFlags,
): EventListener {
	// Since this is a demo, we will not implement the lane system here.
	const eventPriority = "default";
	let listenerWrapper;
	switch (eventPriority) {
		default:
			listenerWrapper = dispatchEvent;
			break;
	}
	return listenerWrapper.bind(
		null,
		domEventName,
		eventSystemFlags,
		targetContainer,
	);
}

export function dispatchEvent(
	domEventName: DOMEventName,
	eventSystemFlags: EventSystemFlags,
	targetContainer: EventTarget,
	nativeEvent: AnyNativeEvent,
): void {
	const nativeEventTarget = nativeEvent.target;

	if (nativeEventTarget === null) {
		return logger.error("This is an internal error. Event target is null.");
	}

	// Since this is a demo,  we simplify the implementation here
	dispatchEventForPluginEventSystem(
		domEventName,
		eventSystemFlags,
		nativeEvent,
		null,
		targetContainer,
	);
}
