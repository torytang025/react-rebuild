import resolve from "@rollup/plugin-node-resolve";
import { defineConfig } from "vite";

export default defineConfig(() => ({
	plugins: [resolve()],
}));
