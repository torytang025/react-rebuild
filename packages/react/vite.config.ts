import path from "path";
import type { UserConfig } from "vite";
import { mergeConfig } from "vite";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

import rootConfig from "../../vite.config.js";

export default defineConfig((config) => {
	return mergeConfig(rootConfig(config), {
		resolve: {
			alias: [
				{
					find: "shared/ReactSharedInternals",
					replacement: path.resolve(
						__dirname,
						"src/ReactSharedInternalsClient.ts",
					),
				},
			],
		},
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
		plugins: [
			dts({
				rollupTypes: true,
				root: ".",
				entryRoot: "src",
				outDir: "dist",
			}),
		],
	} satisfies UserConfig);
});
