// This file is not needed for the react-reconciler package itself.
// This file is a placeholder for the real implementation.

// We assume that this module is only ever shimmed by a specific renderer.

declare module "ReactFiberConfig" {
	type Container = any;
	type Instance = any;
	type TextInstance = any;

	function createInstance(type: string, props: any): Instance;

	function createTextInstance(text: string): Instance;

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
}
