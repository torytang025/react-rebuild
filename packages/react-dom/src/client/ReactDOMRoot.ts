import { createContainer, updateContainer } from "@/react-reconciler";
import type { ReactElement } from "@/shared";

import type { Container } from "./ReactFiberConfigDOM";

export function createRoot(container: Container) {
	const root = createContainer(container);

	return {
		render(element: ReactElement) {
			return updateContainer(element, root);
		},
	};
}
