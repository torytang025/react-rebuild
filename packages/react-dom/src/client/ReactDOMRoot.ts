import {
	createContainer,
	updateContainer,
} from "react-reconciler/ReactFiberReconciler";
import type { FiberRoot } from "react-reconciler/ReactFiberRoot";
import { logger } from "shared/logger";
import type { ReactNodeList } from "shared/ReactTypes";

import { listenToAllSupportedEvents } from "../events/DOMPluginEventSystem";
import { COMMENT_NODE } from "./HTMLNodeType";
import type { Container } from "./ReactFiberConfigDOM";

class ReactDOMRoot {
	_internalRoot: FiberRoot;

	constructor(internalRoot: FiberRoot) {
		this._internalRoot = internalRoot;
	}

	render(children: ReactNodeList) {
		const root = this._internalRoot;
		if (root === null) {
			return logger.error("Cannot update an unmounted root.");
		}
		return updateContainer(children, root);
	}
}

export function createRoot(container: Container) {
	const root = createContainer(container);
	const rootContainerElement =
		container.nodeType === COMMENT_NODE ? container.parentNode : container;

	if (rootContainerElement === null) {
		return logger.error(
			"You are trying to render an element into a container that is not a DOM element.",
		);
	}

	listenToAllSupportedEvents(rootContainerElement);

	return new ReactDOMRoot(root);
}
