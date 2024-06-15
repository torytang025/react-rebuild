import type { Props } from "shared/ReactTypes";

import { COMMENT_NODE } from "./HTMLNodeType";
import { updateProperties } from "./ReactDOMComponent";

export type Container = Element;
export type Instance = Element;
export type TextInstance = Text;

export function createInstance(type: string, props: Props): Instance {
	// TODO process props
	console.log("createInstance", type, props);
	const element = document.createElement(type);
	return element;
}

export function createTextInstance(text: string): TextInstance {
	return document.createTextNode(text);
}

export function appendInitialChild(
	parentInstance: Instance,
	child: Instance | TextInstance,
): void {
	parentInstance.appendChild(child);
}

export function appendChild(
	parentInstance: Instance,
	child: Instance | TextInstance,
): void {
	parentInstance.appendChild(child);
}

export function appendChildToContainer(
	container: Container,
	child: Instance | TextInstance,
): void {
	container.appendChild(child);
}

export function commitTextUpdate(
	textInstance: TextInstance,
	oldText: string,
	newText: string,
): void {
	textInstance.nodeValue = newText;
}

export function commitUpdate(
	domElement: Instance,
	type: string,
	oldProps: Props,
	newProps: Props,
): void {
	updateProperties(domElement, type, oldProps, newProps);
}

export function removeChild(
	parentInstance: Instance,
	child: Instance | TextInstance,
): void {
	parentInstance.removeChild(child);
}

export function removeChildFromContainer(
	container: Container,
	child: Instance | TextInstance,
): void {
	if (container.nodeType === COMMENT_NODE) {
		container.parentNode?.removeChild(child);
	} else {
		container.removeChild(child);
	}
}
