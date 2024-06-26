import path from "path";
import type { UserConfig } from "vite";
import { defineConfig, mergeConfig } from "vite";
import dts from "vite-plugin-dts";

import rootConfig from "../../vite.config.js";

export default defineConfig((config) => {
	return mergeConfig(rootConfig(config), {
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
			rollupOptions: {
				external: ["react", "scheduler"],
			},
		},
		plugins: [
			dts({
				root: ".",
				entryRoot: "src",
				outDir: "dist",
				rollupTypes: true,
			}),
		],
	} satisfies UserConfig);
});
