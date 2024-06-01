import path from "path";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

export default defineConfig({
	resolve: {
		alias: [
			{
				find: "ReactFiberConfig",
				replacement: path.resolve(
					__dirname,
					"src/client/ReactFiberConfigDOM.ts",
				),
			},
		],
	},
	build: {
		lib: {
			entry: {
				index: "src/index.ts",
				client: "src/client/index.ts",
			},
		},
	},
	plugins: [tsconfigPaths()],
});
