// This file contains a simplified version of the real implementation of ReactDOMComponent.

import { hasOwnProperty } from "shared/hasOwnProperty";

import type { CSSProperties } from "./ReactDOMTypes";

export function setValueForAttribute(
	domElement: Element,
	name: string,
	value: string,
): void {
	if (value == null) {
		domElement.removeAttribute(name);
	} else {
		domElement.setAttribute(name, value);
	}
}

function setValueForStyle(
	style: CSSStyleDeclaration,
	styleName: string,
	value: string | number | null | undefined,
): void {
	if (value == null || typeof value === "boolean" || value === "") {
		style.setProperty(styleName, "");
	} else if (typeof value === "number" && value !== 0) {
		style.setProperty(styleName, value + "px");
	} else {
		style.setProperty(styleName, ("" + value).trim());
	}
}

export function setValueForStyles(
	domElement: HTMLElement,
	styles: CSSProperties,
	prevStyles: CSSProperties,
): void {
	const style = domElement.style;

	if (prevStyles != null) {
		for (const styleName in prevStyles) {
			if (
				hasOwnProperty(prevStyles, styleName) &&
				(styles == null || !hasOwnProperty(styles, styleName))
			) {
				setValueForStyle(style, styleName, "");
			}
		}
		for (const styleName in styles) {
			const value = styles[styleName];
			if (
				hasOwnProperty(styles, styleName) &&
				prevStyles[styleName] !== value
			) {
				setValueForStyle(style, styleName, value);
			}
		}
	} else {
		for (const styleName in styles) {
			if (hasOwnProperty(styles, styleName)) {
				const value = styles[styleName];
				setValueForStyle(style, styleName, value);
			}
		}
	}
}
