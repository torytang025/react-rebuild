import { useState } from "react";

function App() {
	const [num, setNum] = useState(0);
	const arr =
		num % 2 === 0
			? [<li key={1}>1</li>, <li key={2}>2</li>, <li key={3}>3</li>]
			: [<li key={3}>3</li>, <li key={2}>2</li>, <li key={1}>1</li>];
	return (
		// <ul
		// 	onClick={(e) => {
		// 		setNum((prev) => prev + 1);
		// 		e.stopPropagation();
		// 	}}
		// >
		// 	{arr}
		// </ul>
		<ul
			onClick={(e) => {
				setNum((prev) => prev + 1);
				e.stopPropagation();
			}}
		>
			<li>a</li>
			<li>b</li>
			{arr}
			{num % 2 === 0 ? <>{arr}</> : null}
		</ul>
	);
}

export default App;
