import type { Dispatcher } from "shared/ReactTypes";

export type SharedStateClient = {
	H: Dispatcher | null; // ReactCurrentDispatcher for Hooks
};

const ReactSharedInternals: SharedStateClient = {
	H: null,
};

export default ReactSharedInternals;
