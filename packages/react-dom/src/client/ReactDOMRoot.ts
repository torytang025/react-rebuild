import {
	createContainer,
	updateContainer,
} from "react-reconciler/ReactFiberReconciler";
import type { ReactElement } from "shared/ReactTypes";

import type { Container } from "./ReactFiberConfigDOM";

export function createRoot(container: Container) {
	const root = createContainer(container);

	return {
		render(element: ReactElement) {
			return updateContainer(element, root);
		},
	};
}
