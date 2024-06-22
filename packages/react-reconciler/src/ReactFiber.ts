import { logger } from "shared/logger";
import { REACT_FRAGMENT_TYPE } from "shared/ReactSymbols";
import type {
	Key,
	Props,
	ReactElement,
	ReactFragment,
	Ref,
	Type,
	UpdateQueue,
} from "shared/ReactTypes";

import type { Flags } from "./ReactFiberFlags";
import { NoFlags } from "./ReactFiberFlags";
import {
	Fragment,
	FunctionComponent,
	HostComponent,
	HostText,
	type WorkTag,
} from "./ReactWorkTag";

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
// TODO finish the generic type
export class Fiber<State = unknown> {
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
	return: Fiber | null;
	/**
	 * points to the first child fiber
	 */
	child: Fiber | null;
	/**
	 * points to the next fiber in the list of siblings
	 */
	sibling: Fiber | null;
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
	 * @example
	 * ```plaintext
	 * HostRoot:
	   For the root fiber (HostRoot) of a React application, memorizedState is the element that is rendered in the root container.
	   Example: For a React app rendered with ReactDOM.createRoot(document.getElementById('root')).render(<App />), the memorizedState of the HostRoot fiber will be the <App /> element.
	   
		 FunctionComponent:
	   For function components, memorizedState is the first hook in the linked list of hooks that store the component's state.

		 ```
	 */
	memorizedState: State | null;
	/**
	 * the queue of updates that need to be applied to this fiber
	 */
	updateQueue: UpdateQueue<State> | null;

	/**
	 * links a fiber to its previous version (work-in-progress -> current), enabling efficient reconciliation between renders.
	 * only exists during the process of generating a new fiber node tree.
	 */
	alternate: Fiber | null;
	/**
	 * a collection of flags that represent the current state of the fiber
	 */
	flags: Flags;
	/**
	 * a collection of flags that represent the state of the subtree rooted at this fiber
	 */
	subtreeFlags: Flags;
	/**
	 * a collection of fibers that represent the children that were deleted from the tree during the current update
	 */
	deletions: Array<Fiber> | null;

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
		this.subtreeFlags = NoFlags;
		this.deletions = null;
	}
}

/**
 * Creates a new work-in-progress fiber node from the current fiber node.
 */
export function createWorkInProgress(
	current: Fiber,
	pendingProps: Props,
): Fiber {
	let workInProgress = current.alternate;

	// This is the case on the first render pass, when the current fiber is the work-in-progress fiber.
	// In this case, we need to create a new work-in-progress fiber.
	if (workInProgress === null) {
		workInProgress = new Fiber(current.tag, pendingProps, current.key);
		workInProgress.stateNode = current.stateNode;
		workInProgress.alternate = current;
		current.alternate = workInProgress;
	} else {
		// This is the case when we're reusing the work-in-progress fiber.
		// We need to clear the effects of the current fiber and update the props.
		workInProgress.pendingProps = pendingProps;
		workInProgress.flags = NoFlags;
		workInProgress.subtreeFlags = NoFlags;
		workInProgress.deletions = null;
	}

	// Reset all the other fields of the work-in-progress fiber.
	workInProgress.type = current.type;
	workInProgress.child = current.child;
	workInProgress.updateQueue = current.updateQueue;
	workInProgress.memorizedProps = current.memorizedProps;
	workInProgress.memorizedState = current.memorizedState;

	return workInProgress;
}

function createFiberFromTypeAndProps(
	type: Type,
	key: Key,
	pendingProps: Props,
) {
	let fiberTag: WorkTag = FunctionComponent;

	if (typeof type === "function") {
		logger.info("Create Fiber from a function component:", type.name);
	} else if (typeof type === "string") {
		logger.info("Create Fiber from a host component:", type);
		// When the type is a string, it represents a host component (e.g., div, span, etc.).
		fiberTag = HostComponent;
	} else {
		switch (type) {
			case REACT_FRAGMENT_TYPE:
				return createFiberFromFragment(
					pendingProps.children as ReactFragment,
					key,
				);

			default: {
				const typeString = type === null ? "null" : typeof type;
				return logger.error(
					"Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: ",
					typeString,
				);
			}
		}
	}

	const fiber = new Fiber(fiberTag, pendingProps, key);
	fiber.type = type;

	return fiber;
}

export function createFiberFromElement(element: ReactElement): Fiber {
	const { key, props, type } = element;
	return createFiberFromTypeAndProps(type, key, props);
}

/**
 * @param elements The children of the fragment
 * @param key The key of the fragment
 * @returns A new FiberNode representing a fragment
 */
export function createFiberFromFragment(
	elements: ReactFragment,
	key: Key,
): Fiber {
	return new Fiber(Fragment, elements, key);
}

export function createFiberFromText(content: string): Fiber {
	const fiber = new Fiber(HostText, content, null);

	return fiber;
}
