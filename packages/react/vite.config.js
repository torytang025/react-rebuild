import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

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
	plugins: [tsconfigPaths()],
});
