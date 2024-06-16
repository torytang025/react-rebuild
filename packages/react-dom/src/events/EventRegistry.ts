import type { DOMEventName } from "./DOMEventNames";

/**
 * Set of all DOM event names.
 */
export const allNativeEvents: Set<DOMEventName> = new Set();

/**
 * Register a two-phase event, which means that the event will be registered for both the bubble and capture phases.
 * @param registrationName The name of the event to register, like "onClick"
 * @param dependencies The event names to register, like ["click"]
 */
export function registerTwoPhaseEvent(
	registrationName: string,
	dependencies: Array<DOMEventName>,
): void {
	// registerDirectEvent is called twice, once for the event and once for the capture phase
	registerDirectEvent(registrationName, dependencies);
	registerDirectEvent(registrationName + "Capture", dependencies);
}

/**
 * Mapping from registration name to event name
 * @example
 * "click" -> ["onClick", "onClickCapture"]
 */
export const registrationNameDependencies: {
	[registrationName: string]: Array<DOMEventName>;
} = {};

export function registerDirectEvent(
	registrationName: string,
	dependencies: Array<DOMEventName>,
): void {
	registrationNameDependencies[registrationName] = dependencies;

	for (let i = 0; i < dependencies.length; i++) {
		allNativeEvents.add(dependencies[i]);
	}
}
