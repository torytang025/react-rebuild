import { type ReactElement, type UpdateQueue } from "shared";

import { FiberNode, FiberRootNode } from "./ReactFiber";
import { type Container } from "./ReactFiberConfig";
import {
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
} from "./ReactFiberUpdateQueue";
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";
import { HostRoot } from "./ReactWorkTag";

/**
 * createContainer is called by ReactDOM.createRoot to create a FiberRootNode.
 */
export function createContainer(containerInfo: Container) {
	const hostRoot = new FiberNode(HostRoot, null, null);
	hostRoot.updateQueue = createUpdateQueue();

	const fiberRoot = new FiberRootNode(containerInfo, hostRoot);
	return fiberRoot;
}

/**
 * updateContainer is called by ReactDOM.createRoot().render() to update the FiberRootNode.
 */
export function updateContainer(
	element: ReactElement | null,
	root: FiberRootNode,
) {
	const hostRoot = root.current;
	const update = createUpdate(element);
	enqueueUpdate(
		hostRoot.updateQueue as UpdateQueue<ReactElement | null>,
		update,
	);
	scheduleUpdateOnFiber(hostRoot);
	return element;
}
