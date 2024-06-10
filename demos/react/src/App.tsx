import { useState } from "react";

function App() {
	const [num, setNum] = useState(0);
	window.setNum = setNum;
	return (
		<div>
			<div>{num}</div>
		</div>
	);
}

export default App;
