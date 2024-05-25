import { defineConfig } from "vite";

import rootConfig from "../../vite.config";

export default defineConfig({
	...rootConfig,
	build: {
		lib: {
			entry: {
				index: "src/index.ts",
				"jsx-runtime": "src/jsx-runtime.ts",
				"jsx-dev-runtime": "src/jsx-dev-runtime.ts",
			},
			name: "React",
		},
	},
});
