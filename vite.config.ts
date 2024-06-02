import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
	const isProd = mode === "production";

	return {
		build: {
			minify: isProd, // Only minify in production
			sourcemap: !isProd, // Production source maps are optional
		},
	};
});
