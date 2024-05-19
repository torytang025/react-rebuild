import {
	CreateElement,
	hasOwnProperty,
	JSX,
	type Key,
	type Props,
	REACT_ELEMENT_TYPE,
	type ReactElement as ReactElementType,
	type Ref,
	type Type,
} from "shared";

export const ReactElement = (
	type: Type,
	key: Key,
	ref: Ref,
	props: Props,
): ReactElementType => {
	const element: ReactElementType = {
		$$typeof: REACT_ELEMENT_TYPE,
		type: type,
		key: key,
		ref: ref,
		props: props,

		// This tag allows us to uniquely identify this as a replica of React
		__version: "react-rebuild",
	};

	return element;
};

export const createElement: CreateElement = (
	type,
	config,
	...maybeChildren
) => {
	let key: Key = null;
	const props: Props = {};
	let ref: Ref = null;

	for (const propName in config) {
		const val = config[propName];
		// NOTE: hasOwnProperty is not necessary here
		// Because key and ref are directly assigned in JSX, making it unlikely for them to be inherited properties.
		// like this: <div key="key" ref="ref" />
		if (propName === "key" && val !== undefined) {
			key = ("" + val) as Key;
			continue;
		}

		if (propName === "ref" && val !== undefined) {
			ref = val as Ref;
			continue;
		}

		// NOTE: hasOwnProperty is necessary here
		// Ensures that only properties directly on the config object are copied to the props object.
		if (hasOwnProperty(config, propName)) {
			props[propName] = val;
			continue;
		}
	}

	const childrenLength = maybeChildren.length;
	if (childrenLength === 1) {
		props.children = maybeChildren[0];
	} else if (childrenLength > 1) {
		props.children = maybeChildren;
	}

	return ReactElement(type, key, ref, props);
};

export const jsxProd: JSX = (type, config, maybeKey) => {
	let key: Key = null;
	const props: Props = {};
	let ref: Ref = null;

	if (maybeKey !== undefined) {
		key = ("" + maybeKey) as Key;
	}

	for (const propName in config) {
		const val = config[propName];

		// NOTE: key can be spread in config
		// like this: <div key="key" {...props} />
		if (propName === "key" && val !== undefined) {
			key = ("" + val) as Key;
			continue;
		}

		if (propName === "ref" && val !== undefined) {
			ref = val as Ref;
			continue;
		}

		if (hasOwnProperty(config, propName)) {
			props[propName] = val;
			continue;
		}
	}

	return ReactElement(type, key, ref, props);
};

export const jsxDEV: JSX = jsxProd;
