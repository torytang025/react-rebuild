import { useState } from "react";

function App() {
	const [num, setNum] = useState(9);

	return (
		<ul
			id="ul"
			onClick={(e) => {
				setNum((prev) => {
					return prev + 1;
				});
				setNum((prev) => {
					return prev + 1;
				});
				setNum((prev) => {
					return prev + 1;
				});
				e.stopPropagation();
			}}
		>
			{num}
		</ul>
	);
}

export default App;
