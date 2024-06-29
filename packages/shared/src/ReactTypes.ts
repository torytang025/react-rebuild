import type { Lane } from "react-reconciler/ReactFiberLane";
import type { HookFlags } from "react-reconciler/ReactHookEffectTags";

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
 * - lane: The lane that the update belongs to.
 * - next: A reference to the next update in the circular list.
 */
export type Update<S = any, T = any> = {
	action: Action<S>;
	lane: Lane;

	next: Update<T> | null;
};

/**
 * The updateQueue property is an object that holds the pending updates for a fiber.
 * It is used to manage the state updates for a component. The updateQueue object has the following structure:
 *
 * - pending: The pending update for the fiber. This is an object that represents the update to be applied to the component.
 * - dispatch: A function that takes an action and enqueues it in the update queue.
 */
export type UpdateQueue<State> = {
	pending: Update<State> | null;
	dispatch: Dispatch<State> | null;
	lastEffect: Effect | null;
};

export type InitialState<S> = S | (() => S);
export type Dispatch<S> = (action: Action<S>) => void;
export type SetStateReturn<S> = [S, Dispatch<S>];

export type UseState = <S>(initialState: InitialState<S>) => SetStateReturn<S>;

export type DependencyList = readonly unknown[];
export type Destroy = (() => void) | void;
export type EffectCallback = () => Destroy | void;
export type Effect = {
	tag: HookFlags;
	create: EffectCallback;
	destroy?: Destroy;
	deps?: DependencyList;
	next: Effect | null;
};

export type UseEffect = (effect: EffectCallback, deps?: DependencyList) => void;

export type Dispatcher = {
	useState: UseState;
	useEffect: UseEffect;
};
