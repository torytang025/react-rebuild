export type WorkTag =
	| typeof FunctionComponent
	| typeof HostRoot
	| typeof HostComponent
	| typeof HostText
	| typeof Fragment;

/**
 * @example const MyComponent = () => <div>hello</div>;
 */
export const FunctionComponent = 0;

/**
 * Represents the root container where the React app is mounted.
 * @example div#root is the root container of ReactDOM.createRoot(document.getElementById('root')).render(<App />);
 */
export const HostRoot = 3;

/**
 * Represents an element in the host environment, like a native DOM element.
 * @example <h1>hello</h1>
 */
export const HostComponent = 5;

/**
 * Represents a text node.
 * @example "hello" inside this element <h1>hello</h1>
 */
export const HostText = 6;

/**
 * Represents a React fragment.
 * @example <React.Fragment>hello</React.Fragment> or <>hello</>
 */
export const Fragment = 7;
