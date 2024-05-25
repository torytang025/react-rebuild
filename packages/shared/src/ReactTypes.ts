export type Type = any;
export type Props = any;
export type Key = any;
export type Ref = { current: any } | ((instance: any) => void) | null;

export interface ReactElement {
	$$typeof: symbol | number;
	type: Type;
	props: Props;
	key: Key;
	ref: Ref;

	// DEV only
	__version: string;
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
export type Update<State> = {
	action: Action<State>;
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
};
