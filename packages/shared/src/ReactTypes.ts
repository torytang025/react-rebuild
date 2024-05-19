/* eslint-disable @typescript-eslint/no-explicit-any */

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
