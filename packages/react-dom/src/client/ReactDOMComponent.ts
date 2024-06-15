import { hasOwnProperty } from "shared/hasOwnProperty";
import type { Props } from "shared/ReactTypes";

import {
	setValueForAttribute,
	setValueForStyles,
} from "./DOMPropertyOperations";
import type { CSSProperties } from "./ReactDOMTypes";

function setProp(
	domElement: Element,
	tag: string,
	key: string,
	value: unknown,
	props: Props,
	prevValue: unknown,
): void {
	// Since this is a simplified example, we wouldn't implement all properties here
	switch (key) {
		case "className":
			setValueForAttribute(domElement, "class", value as string);
			break;
		case "style":
			setValueForStyles(
				domElement as HTMLElement,
				value as CSSProperties,
				prevValue as CSSProperties,
			);
			break;
		default: {
			setValueForAttribute(domElement, key, value as string);
		}
	}
}

export function updateProperties(
	domElement: Element,
	tag: string,
	lastProps: Props,
	nextProps: Props,
): void {
	// Since this is a simplified example, we wouldn't list all tag here
	// For the sake of the example, we only list div and span
	switch (tag) {
		case "div":
		case "span":
			break;
	}

	// delete properties that are not in nextProps
	for (const propKey in lastProps) {
		const lastProp = lastProps[propKey];
		if (
			hasOwnProperty(nextProps, propKey) &&
			lastProp != null &&
			!hasOwnProperty(nextProps, propKey)
		) {
			setProp(domElement, tag, propKey, null, nextProps, lastProp);
		}
	}

	// set new properties
	for (const propKey in nextProps) {
		const nextProp = nextProps[propKey];
		const lastProp = lastProps[propKey];
		if (
			hasOwnProperty(nextProps, propKey) &&
			nextProp !== lastProp &&
			(lastProp != null || nextProp != null)
		) {
			setProp(domElement, tag, propKey, nextProp, nextProps, lastProp);
		}
	}
}
