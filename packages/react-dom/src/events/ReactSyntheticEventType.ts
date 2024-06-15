export interface BaseSyntheticEvent {
	isPropagationStopped: () => boolean;
	isDefaultPrevented: () => boolean;
	currentTarget: null | EventTarget;
}

export type KnownReactSyntheticEvent = BaseSyntheticEvent & {
	_reactName: string;
};
export type UnknownReactSyntheticEvent = BaseSyntheticEvent & {
	_reactName: null;
};

export type ReactSyntheticEvent =
	| KnownReactSyntheticEvent
	| UnknownReactSyntheticEvent;
