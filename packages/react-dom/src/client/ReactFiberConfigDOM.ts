import type { Props } from "shared/ReactTypes";

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
