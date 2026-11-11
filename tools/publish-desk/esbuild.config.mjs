import { copyFile, mkdir } from "node:fs/promises";
import { builtinModules } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import esbuild from "esbuild";

const projectDirectory = path.dirname(fileURLToPath(import.meta.url));
const outputDirectory = path.resolve(
	projectDirectory,
	"../../src/content/.obsidian/plugins/publish-desk",
);
const production = process.argv[2] === "production";

await mkdir(outputDirectory, { recursive: true });
await copyFile(
	path.join(projectDirectory, "manifest.json"),
	path.join(outputDirectory, "manifest.json"),
);
await copyFile(
	path.join(projectDirectory, "styles.css"),
	path.join(outputDirectory, "styles.css"),
);

const context = await esbuild.context({
	entryPoints: [path.join(projectDirectory, "src/main.ts")],
	bundle: true,
	external: ["obsidian", "electron", ...builtinModules],
	format: "cjs",
	target: "es2021",
	logLevel: "info",
	sourcemap: production ? false : "inline",
	treeShaking: true,
	minify: production,
	outfile: path.join(outputDirectory, "main.js"),
});

if (production) {
	await context.rebuild();
	await context.dispose();
} else {
	await context.watch();
}
