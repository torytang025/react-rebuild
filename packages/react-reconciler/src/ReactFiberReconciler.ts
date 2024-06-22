import { type Container } from "ReactFiberConfig";
import type {
	ReactElement,
	ReactNodeList,
	UpdateQueue,
} from "shared/ReactTypes";

import { Fiber } from "./ReactFiber";
import { FiberRoot } from "./ReactFiberRoot";
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
	const hostRoot = new Fiber(HostRoot, null, null);
	hostRoot.updateQueue = createUpdateQueue();

	const fiberRoot = new FiberRoot(containerInfo, hostRoot);
	return fiberRoot;
}

/**
 * updateContainer is called by ReactDOM.createRoot().render() to update the FiberRootNode.
 */
export function updateContainer(element: ReactNodeList, root: FiberRoot) {
	const hostRoot = root.current;
	const update = createUpdate(element);
	enqueueUpdate(hostRoot.updateQueue as UpdateQueue<ReactNodeList>, update);
	scheduleUpdateOnFiber(hostRoot);
	return element;
}
