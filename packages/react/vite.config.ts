import type { UserConfig } from "vite";
import { mergeConfig } from "vite";
import { defineConfig } from "vite";

import rootConfig from "../../vite.config.js";

export default defineConfig((config) => {
	return mergeConfig(rootConfig(config), {
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
	} satisfies UserConfig);
});
