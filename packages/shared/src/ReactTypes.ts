import type { Lane } from "react-reconciler/ReactFiberLane";

export type Type = any;
export type Props = any;
export type Key = string | number | bigint | null | undefined;
export type Ref = { current: any } | ((instance: any) => void) | null;

export type Component = any;

export type ReactNode =
	| ReactElement
	| ReactText
	| Iterable<ReactNode>
	| boolean
	| null
	| undefined;

export type ReactEmpty = null | void | boolean;
export type ReactFragment = ReactEmpty | Iterable<ReactNode>;
export type ReactNodeList = ReactEmpty | ReactNode;
export type ReactText = string | number;

export interface ReactElement {
	/**
	 * @internal
	 * Annotation that marks the object as a React Element. We use this to determine if an object is a React Element.
	 */
	$$typeof: symbol;
	/**
	 * The type of the element. This can be a string (for built-in components) or a class/function (for composite components) or a symbol (for fragments).
	 */
	type: Type;
	/**
	 * The props of the element.
	 */
	props: Props;
	/**
	 * The key of the element.
	 */
	key: Key;
	/**
	 * @internal
	 * The ref of the element. This won't be exposed to the user, instead it will be extracted from the props.
	 */
	ref: Ref;

	/**
	 * @internal
	 * Annotation that marks the object as a replica of React.
	 */
	__version: "react-rebuild";
}

export type CreateElement = (
	type: Type,
	config: any,
	...maybeChildren: any[]
) => ReactElement;

export type JSX = (type: Type, config: any, maybeKey: Key) => ReactElement;

/**
 * The Action type is a union of two types:
 * - State: The state object that represents the new state of the component.
 * - (prevState: State) => State: A function that takes the previous state of the component as an argument and returns the new state of the component.
 * The Action type is used to represent the action that needs to be applied to the component.
 */
export type Action<State> = State | ((prevState: State) => State);

/**
 * The Update type is an object that represents the update to be applied to the component. It has the following structure:
 * - action: The action that needs to be applied to the component.
 */
export type Update<State = any> = {
	action: Action<State>;
	lane: Lane;
	next: Update<any> | null;
};

export type SharedQueue<State> = {
	pending: Update<State> | null;
};

/**
 * The updateQueue property is an object that holds the pending updates for a fiber. It is used to manage the state updates for a component. The updateQueue object has the following structure:
	- shared: An object that holds the pending update for the fiber.
	- shared.pending: The pending update for the fiber. This is an object that represents the update to be applied to the component.
 */
export type UpdateQueue<State> = {
	shared: SharedQueue<State>;
	dispatch: Dispatch<State> | null;
};

export type InitialState<S> = S | (() => S);
export type Dispatch<S> = (action: Action<S>) => void;
export type SetStateReturn<S> = [S, Dispatch<S>];

export type UseState = <S>(initialState: InitialState<S>) => SetStateReturn<S>;

export type Dispatcher = {
	useState: UseState;
};
