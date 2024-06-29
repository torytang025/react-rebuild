import { useEffect, useState } from "react";

function SubChild({ num }: { num: number }) {
	useEffect(() => {
		console.log("Sub Child mount, num:", num);
		return () => console.log("Sub Child unmount, num:", num);
	}, []);

	return <div className="child">Sub Child</div>;
}

function Child({ num }: { num: number }) {
	useEffect(() => {
		console.log("Child mount, num:", num);
		return () => console.log("Child unmount, num:", num);
	}, []);

	return (
		<div className="child">
			<div>Child</div>
			<SubChild num={num} />
			<SubChild num={num + 1} />
		</div>
	);
}

function App() {
	const [num, updateNum] = useState(0);
	const [count, setCount] = useState(0);

	useEffect(() => {
		console.log("App mount, num:", num);
		return () => {
			setCount((prev) => prev + 1);
			console.log("App unmount, num:", num);
		};
	}, [num]);

	return (
		<div className="app" onClick={() => updateNum(num + 1)}>
			<span>{count}</span>
			<div>{num % 2 === 0 ? <Child num={num} /> : num}</div>
		</div>
	);
}

export default App;
