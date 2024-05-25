import { defineConfig } from "vite";

import rootConfig from "../../vite.config";

export default defineConfig({
	...rootConfig,
	build: {
		lib: {
			entry: "src/index.ts",
			name: "ReactReconciler",
			fileName: "index",
		},
	},
});
