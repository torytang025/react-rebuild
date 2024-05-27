// This file is not needed for the react-reconciler package itself.
// This file is a placeholder for the real implementation.

// We assume that this module is only ever shimmed by a specific renderer.

export type Container = any;

export type Instance = any;

export declare function createInstance(type: string, props: any): Instance;

export declare function createTextInstance(text: string): Instance;

export declare function appendInitialChild(
	parent: Instance,
	child: Instance,
): void;

throw new Error("This module must be shimmed by a specific renderer.");
