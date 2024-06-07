import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
	const isProd = mode === "production";

	return {
		build: {
			minify: isProd, // Only minify in production
			sourcemap: !isProd, // Production source maps are optional
		},
		plugins: [tsconfigPaths()],
	};
});
