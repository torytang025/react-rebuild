import type { Container } from "ReactFiberConfig";

import type { Fiber } from "./ReactFiber";
import { type Lanes, NoLanes } from "./ReactFiberLane";

/**
 * This is an internal structure in React Fiber that contains the information needed to manage the root of the React application.
 * It is created when call ReactDOM.createRoot(document.getElementById('root')). The FiberRootNode contains a reference to the actual DOM container (div#root) and the root of the fiber tree (the HostRoot).
 * ```plaintext
 * ReactDOM.createRoot(rootElement).render(<App/>)
					|
					v
	 +-----------------+
	 |  fiberRootNode  |
	 +-----------------+
								|	      	^
						current     |
								|     stateNode
								v         |
	 +-----------------+
	 |  hostRootFiber  |
	 +-----------------+
								|        ^
						child    	 |
								|     return
								v        |
	 +-----------------+
	 |       App       |
	 +-----------------+
 * ```
 */

export class FiberRoot {
	containerInfo: Container;
	current: Fiber;
	finishedWork: Fiber | null;

	pendingLanes: Lanes;
	finishedLanes: Lanes;

	constructor(containerInfo: Container, hostRootFiber: Fiber) {
		this.containerInfo = containerInfo;
		this.current = hostRootFiber;
		hostRootFiber.stateNode = this;
		this.finishedWork = null;

		this.pendingLanes = NoLanes;
		this.finishedLanes = NoLanes;
	}
}
