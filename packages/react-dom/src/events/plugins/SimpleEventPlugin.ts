import type { FiberNode } from "react-reconciler/ReactFiber";

import type { DOMEventName } from "../DOMEventNames";
import {
	registerSimpleEvents,
	topLevelEventsToReactNames,
} from "../DOMEventPropery";
import {
	accumulateEventListeners,
	type DispatchQueue,
} from "../DOMPluginEventSystem";
import { type EventSystemFlags, IS_CAPTURE_PHASE } from "../EventSystemFlags";
import type { AnyNativeEvent } from "../PluginModuleType";
import { SyntheticEvent } from "../SyntheticEvent";

function extractEvents(
	dispatchQueue: DispatchQueue,
	domEventName: DOMEventName,
	targetInst: null | FiberNode,
	nativeEvent: AnyNativeEvent,
	nativeEventTarget: null | EventTarget,
	eventSystemFlags: EventSystemFlags,
	targetContainer: EventTarget,
): void {
	const reactName = topLevelEventsToReactNames.get(domEventName);
	if (reactName === undefined || nativeEventTarget == null) {
		return;
	}

	const SyntheticEventCtor = SyntheticEvent;
	const inCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0;

	const event = SyntheticEventCtor(
		reactName,
		domEventName,
		targetInst,
		nativeEvent,
		nativeEventTarget,
	);

	const listeners = accumulateEventListeners(
		nativeEventTarget,
		targetContainer,
		reactName,
		nativeEvent.type,
		inCapturePhase,
	);

	dispatchQueue.push({ event, listeners });
}

export { extractEvents, registerSimpleEvents as registerEvents };
