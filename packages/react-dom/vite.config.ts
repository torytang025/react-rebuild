import path from "path";
import type { UserConfig } from "vite";
import { defineConfig, mergeConfig } from "vite";

import rootConfig from "../../vite.config.js";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

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
		},
	} satisfies UserConfig);
});
