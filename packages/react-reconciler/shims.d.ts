// This file is not needed for the react-reconciler package itself.
// This file is a placeholder for the real implementation.

// We assume that this module is only ever shimmed by a specific renderer.

declare module "ReactFiberConfig" {
	type Container = any;
	type Instance = any;
	type TextInstance = any;

	function createInstance(type: string, props: any): Instance;

	function createTextInstance(text: string): Instance;

	export function finalizeInitialChildren(
		domElement: Instance,
		type: string,
		props: Props,
	): boolean;

	function appendInitialChild(
		parentInstance: Instance,
		child: Instance | TextInstance,
	): void;

	function appendChild(
		parentInstance: Instance,
		child: Instance | TextInstance,
	): void;

	function appendChildToContainer(
		container: Container,
		child: Instance | TextInstance,
	): void;

	function commitTextUpdate(
		textInstance: TextInstance,
		oldText: string,
		newText: string,
	): void;

	function commitUpdate(
		domElement: Instance,
		type: string,
		oldProps: Props,
		newProps: Props,
	): void;

	function removeChild(
		parentInstance: Instance,
		child: Instance | TextInstance,
	): void;

	function removeChildFromContainer(
		container: Container,
		child: Instance | TextInstance,
	): void;
}
