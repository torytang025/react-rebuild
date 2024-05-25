import { Key, Props, Ref } from "shared";

import { Container } from "./ReactFiberConfig";
import { Flags, NoFlags } from "./ReactFiberFlags";
import { WorkTag } from "./ReactWorkTag";

/**
 * Represents a node in the Fiber tree. Each Fiber node corresponds to a React element/component.
 * 
 * @example
 * 
 * ```jsx
    import React from 'react';
    import ReactDOM from 'react-dom';

    function MyFunctionComponent() {
      return <div>Function Component</div>;
    }

    class MyClassComponent extends React.Component {
      render() {
        return <div>Class Component</div>;
      }
    }

    const App = () => (
      <React.Fragment>
        <MyFunctionComponent />
        <MyClassComponent />
        <div>Regular Div</div>
        Hello, world!
      </React.Fragment>
    );

    ReactDOM.render(<App />, document.getElementById('root'));
  ```
  The fiber tree for the above example will look like this:
  ```plaintext
  FiberNode (tag: HostRoot, type: null, stateNode: #root)
  └── FiberNode (tag: Fragment, type: React.Fragment, stateNode: null)
        ├── FiberNode (tag: FunctionComponent, type: MyFunctionComponent, stateNode: null)
        │      └── FiberNode (tag: HostComponent, type: 'div', stateNode: <div> "Function Component")
        ├── FiberNode (tag: ClassComponent, type: MyClassComponent, stateNode: MyClassComponent instance)
        │      └── FiberNode (tag: HostComponent, type: 'div', stateNode: <div> "Class Component")
        ├── FiberNode (tag: HostComponent, type: 'div', stateNode: <div> "Regular Div")
        └── FiberNode (tag: HostText, type: null, stateNode: "Hello, world!")
  ```
 */
export class FiberNode {
	/**
	 * the unique identifier for this fiber
	 */
	key: Key;
	/**
	 * hold a reference to a DOM element or a React component instance.
	 * This allows us to interact directly with the underlying DOM nodes or React components.
	 */
	ref: Ref;

	// === Identity ===

	/**
	 * the type of work or component the fiber represents
	 * @example see WorkTag
	 */
	tag: WorkTag;
	/**
	 * the type of the component or element this fiber represents
   * @example
   * ```plaintext
    FunctionComponent:
      If the fiber represents a function component, type will be a reference to the function itself.
      Example: For a function component function MyComponent() { return <div>Hello</div>; }, the type property of its fiber will be MyComponent.
    ClassComponent:
      If the fiber represents a class component, type will be a reference to the class constructor.
      Example: For a class component class MyComponent extends React.Component { render() { return <div>Hello</div>; } }, the type property of its fiber will be MyComponent.
    HostComponent:
      If the fiber represents a standard DOM element, type will be a string corresponding to the HTML tag name (e.g., 'div', 'span', 'button').
      Example: For a <div> element, the type property of its fiber will be 'div'.
    HostText:
      If the fiber represents a text node, the type property is null because text nodes do not have a specific type.
      Example: For a text node containing "Hello", the type property of its fiber will be null.
    Fragment:
      If the fiber represents a React fragment, type will be React.Fragment.
      Example: For a fragment created using <></>, the type property of its fiber will be React.Fragment.
    ```
	 */
	type: any;
	/**
	 * a direct reference to the actual instances (DOM nodes, component instances, or root containers) associated with this fiber
   * @example
   * ```plaintext
    HostComponent:
      For fibers representing DOM elements (e.g., <div>, <span>), the stateNode points to the corresponding DOM node.
      Example: If a fiber represents a <div> element, stateNode will be a reference to that DOM div.
    ClassComponent:
      For fibers representing class components, the stateNode points to the instance of the component created by the constructor.
      Example: If a fiber represents a class component MyComponent, stateNode will be a reference to the instance of MyComponent.
    FunctionComponent:
      Function components do not have instances in the same way class components do, so stateNode is typically null for function component fibers.
      Example: If a fiber represents a function component MyFunctionComponent, stateNode will be null.
    HostRoot:
      For the root fiber (HostRoot) of a React application, the stateNode points to the FiberRootNode, which contains the reference to the root container where the React tree is mounted. See FiberRootNode for more information.
      Example: For a React app rendered with ReactDOM.createRoot(document.getElementById('root')).render(<App />), the stateNode of the HostRoot fiber points to the FiberRootNode, which in turn holds a reference to the container DOM node with the id root.
    ```
	 */
	stateNode: any;

	// === Hierarchy ===

	/**
	 * points to the parent fiber
	 */
	return: FiberNode | null;
	/**
	 * points to the first child fiber
	 */
	child: FiberNode | null;
	/**
	 * points to the next fiber in the list of siblings
	 */
	sibling: FiberNode | null;
	/**
	 * the index of this fiber in the list of siblings
	 */
	index: number;

	// === State ===

	/**
	 * represents the next set of props that a component will receive
	 */
	pendingProps: Props;
	/**
	 * represents the props that were last applied to the component after the reconciliation process completed.
	 */
	memorizedProps: Props | null;
	/**
	 * represents the internal state of a component
	 */
	memorizedState: any;
	/**
	 * the queue of updates that need to be applied to this fiber
	 */
	updateQueue: unknown;

	/**
	 * links a fiber to its previous version (work-in-progress -> current), enabling efficient reconciliation between renders.
	 * only exists during the process of generating a new fiber node tree.
	 */
	alternate: FiberNode | null;
	flags: Flags;

	constructor(tag: WorkTag, pendingProps: Props, key: Key) {
		this.key = key;
		this.ref = null;

		this.tag = tag;
		this.stateNode = null;
		this.type = null;

		this.return = null;
		this.sibling = null;
		this.child = null;
		this.index = 0;

		this.pendingProps = pendingProps;
		this.memorizedProps = null;
		this.memorizedState = null;
		this.updateQueue = null;

		this.alternate = null;
		this.flags = NoFlags;
	}
}

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

/**
 * Creates a new work-in-progress fiber node.
 */
export function createWorkInProgress(
	current: FiberNode,
	pendingProps: Props,
): FiberNode {
	let workInProgress = current.alternate;

	// This is the case on the first render pass, when the current fiber is the work-in-progress fiber.
	// In this case, we need to create a new work-in-progress fiber.
	if (workInProgress === null) {
		workInProgress = new FiberNode(current.tag, pendingProps, current.key);
		workInProgress.stateNode = current.stateNode;
		workInProgress.alternate = current;
		current.alternate = workInProgress;
	} else {
		// This is the case when we're reusing the work-in-progress fiber.
		// We need to reset it to its original state.
		workInProgress.pendingProps = pendingProps;
		workInProgress.flags = NoFlags;
	}

	// Reset all the other fields of the work-in-progress fiber.
	workInProgress.type = current.type;
	workInProgress.child = current.child;
	workInProgress.updateQueue = current.updateQueue;
	workInProgress.pendingProps = pendingProps;
	workInProgress.memorizedProps = current.memorizedProps;

	return workInProgress;
}