// Just for example, we are not listing all the DOM event here.
export type DOMEventName =
	| "click"
	| "blur"
	| "focus"
	| "input"
	| "mousedown"
	| "mouseenter"
	| "mouseleave"
	| "mousemove"
	| "mouseout"
	| "mouseover"
	| "scroll"
	| "scrollend";

// We should not delegate these events to the container, but rather
// set them on the actual target element itself. This is primarily
// because these events do not consistently bubble in the DOM.
export const nonDelegatedEvents: Set<DOMEventName> = new Set([
	// Just for example, we are not listing all the DOM event here.
	"scroll",
	"scrollend",
]);
