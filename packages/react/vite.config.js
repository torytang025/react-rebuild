import { defineConfig } from "vite";

export default defineConfig({
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
