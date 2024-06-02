function processArgs(args: any[]) {
	let result = "";

	if (args.length === 0) {
		return result;
	}

	for (let i = 0; i < args.length; i++) {
		if (typeof args[i] === "object") {
			result += JSON.stringify(args[i]) + " ";
		} else {
			result += args[i] + " ";
		}
	}

	return result;
}

function info(message: string, ...args: any[]) {
	if (import.meta.env.DEV) {
		console.log(
			`%c[Info][Logger From React Rebuild]`,
			"color: blue; font-weight: bold; background-color: lightgray; padding: 4px;",
			`${message} ${processArgs(args)}`,
		);
	}
}

function error(message: string, ...args: any[]): never {
	console.error(
		`%c[Error][Logger From React Rebuild]`,
		"color: red; font-weight: bold; background-color: lightgray; padding: 4px;",
		`${message} ${processArgs(args)}`,
	);
	throw new Error(message);
}

const logger = {
	info,
	error,
};

export { logger };
