/** @type {import("prettier").Config} */
const config = {
	trailingComma: "all",
	useTabs: true,
	plugins: [require.resolve("prettier-plugin-packagejson")],
};

module.exports = config;
