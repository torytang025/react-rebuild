import type { Fiber } from "react-reconciler/ReactFiber";
import { hasOwnProperty } from "shared/hasOwnProperty";
import { logger } from "shared/logger";
import type { Props } from "shared/ReactTypes";

import { registrationNameDependencies } from "../events/EventRegistry";
import {
	setValueForAttribute,
	setValueForStyles,
} from "./DOMPropertyOperations";
import type { CSSProperties } from "./ReactDOMTypes";
import type { Instance, TextInstance } from "./ReactFiberConfigDOM";

const randomKey = Math.random().toString(36).slice(2);
const internalPropsKey = "__reactProps$" + randomKey;
const internalInstanceKey = "__reactFiber$" + randomKey;

export function precacheFiberNode(
	hostInst: Fiber,
	node: Instance | TextInstance,
): void {
	(node as any)[internalInstanceKey] = hostInst;
}

export function detachDeletedInstance(node: Instance | TextInstance): void {
	delete (node as any)[internalInstanceKey];
	delete (node as any)[internalPropsKey];
}

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
		case "children":
			break;
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
			if (
				key.length > 2 &&
				(key[0] === "o" || key[0] === "O") &&
				(key[1] === "n" || key[1] === "N")
			) {
				if (
					hasOwnProperty(registrationNameDependencies, key) &&
					value != null &&
					typeof value !== "function"
				) {
					logger.error("Event handler is not a function");
				}
			} else {
				setValueForAttribute(domElement, key, value as string);
			}
		}
	}
}

/**
 * This is used to set initial properties on the DOM element.
 */
export function setInitialProperties(
	domElement: Element,
	tag: string,
	props: Props,
): void {
	// Since this is a simplified example, we wouldn't list all tag here
	// For the sake of the example, we only list div and span
	switch (tag) {
		case "div":
		case "span":
			break;
	}

	for (const propKey in props) {
		if (!hasOwnProperty(props, propKey)) {
			continue;
		}
		const propsValue = props[propKey];
		if (propKey === null) {
			continue;
		} else {
			setProp(domElement, tag, propKey, propsValue, props, null);
		}
	}
}

/**
 * This is used to update the DOM element with new properties.
 */
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
			hasOwnProperty(lastProps, propKey) &&
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

export function updateFiberProps(
	node: Instance | TextInstance,
	props: Props,
): void {
	(node as any)[internalPropsKey] = props;
}

export function getFiberCurrentPropsFromNode(
	node: Instance | TextInstance,
): Props {
	return (node as any)[internalPropsKey] || null;
}
