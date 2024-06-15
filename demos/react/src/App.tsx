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
	return (
		<div
			onClick={() => {
				console.log(
					"%c [ onClickCapture ]-22-「App.tsx」",
					"font-size:13px; background:#FFFF00; color:#bf2c9f;",
				);
			}}
			style={{
				cursor: "pointer",
			}}
		>
			<div
				onClick={(e) => {
					setNum((prev) => prev + 1);
					// e.stopPropagation();
				}}
			>
				{num % 2 === 0 ? <Child /> : <div>{num}</div>}
			</div>
		</div>
	);
}

export default App;
