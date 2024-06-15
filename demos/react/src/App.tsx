import { useState } from "react";

function SubChild() {
	return (
		<div>
			<p>
				<span>Sub Child</span>
			</p>
		</div>
	);
}

function Child() {
	return <SubChild />;
}

function App() {
	const [num, setNum] = useState(0);
	window.setNum = setNum;
	return num % 2 === 0 ? <Child /> : <div>{num}</div>;
}

export default App;
