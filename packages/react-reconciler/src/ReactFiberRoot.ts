import type { FiberNode } from "./ReactFiber";
import type { Container } from "./ReactFiberConfig";

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

export class FiberRootNode {
	containerInfo: Container;
	current: FiberNode;
	finishedWork: FiberNode | null;

	constructor(containerInfo: Container, hostRootFiber: FiberNode) {
		this.containerInfo = containerInfo;
		this.current = hostRootFiber;
		hostRootFiber.stateNode = this;
		this.finishedWork = null;
	}
}
