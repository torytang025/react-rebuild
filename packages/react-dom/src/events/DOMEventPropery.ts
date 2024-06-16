import type { DOMEventName } from "./DOMEventNames";
import { registerTwoPhaseEvent } from "./EventRegistry";

export const topLevelEventsToReactNames: Map<DOMEventName, string | null> =
	new Map();

const simpleEventPluginEvents: DOMEventName[] = [
	"click",
	"mousedown",
	"mouseenter",
	"mouseleave",
	"mousemove",
	"mouseout",
	"mouseover",
];

function registerSimpleEvent(domEventName: DOMEventName, reactName: string) {
	topLevelEventsToReactNames.set(domEventName, reactName);
	registerTwoPhaseEvent(reactName, [domEventName]);
}

export function registerSimpleEvents() {
	for (let i = 0; i < simpleEventPluginEvents.length; i++) {
		const eventName = simpleEventPluginEvents[i];
		// domEventName, used to register the event in the browser
		const domEventName = eventName.toLowerCase() as DOMEventName;
		// capitalizedEvent, used to create reactName, like "Click"
		const capitalizedEvent = eventName[0].toUpperCase() + eventName.slice(1);
		registerSimpleEvent(domEventName, "on" + capitalizedEvent);
	}
}
