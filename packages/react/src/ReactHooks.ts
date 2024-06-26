import { logger } from "shared/logger";
import ReactSharedInternals from "shared/ReactSharedInternals";
import type { Dispatcher, UseEffect, UseState } from "shared/ReactTypes";

function resolveDispatcher(): Dispatcher {
	const dispatcher = ReactSharedInternals.H;

	if (dispatcher === null) {
		return logger.error(
			"[resolveDispatcher] Hooks can only be called inside the body of a function component.",
		);
	}

	return dispatcher;
}

export const useState: UseState = (initialState) => {
	const dispatcher = resolveDispatcher();
	return dispatcher.useState(initialState);
};

export const useEffect: UseEffect = (create, deps) => {
	const dispatcher = resolveDispatcher();
	return dispatcher.useEffect(create, deps);
};
