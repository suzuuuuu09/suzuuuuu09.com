import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

const MARKDOWN_DIRECTORY = "_markdown";
const SKIPPED_ROOTS = new Set(["_astro", "api", "~partytown"]);

function createConverter() {
	const turndown = new TurndownService({
		headingStyle: "atx",
		codeBlockStyle: "fenced",
		bulletListMarker: "-",
	});
	turndown.use(gfm);
	turndown.addRule("discardUi", {
		filter: (node) => {
			const name = node.nodeName.toLowerCase();
			if (
				[
					"script",
					"style",
					"svg",
					"nav",
					"header",
					"footer",
					"form",
					"button",
					"noscript",
					"iframe",
				].includes(name)
			) {
				return true;
			}
			return (node.getAttribute?.("class") ?? "").includes(
				"heading-anchor-container",
			);
		},
		replacement: () => "",
	});
	return turndown;
}

function extractMainContent(html) {
	if (/<meta[^>]+http-equiv=["']?refresh/i.test(html)) return null;
	const match =
		/<main\b[^>]*\bid=["']main-content["'][^>]*>([\s\S]*?)<\/main>/i.exec(html);
	return match?.[1] ?? null;
}

function htmlFiles(directory) {
	const files = [];
	for (const entry of readdirSync(directory, { withFileTypes: true }).sort(
		(a, b) => a.name.localeCompare(b.name),
	)) {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) {
			files.push(...htmlFiles(path));
		} else if (entry.isFile() && entry.name === "index.html") {
			files.push(path);
		}
	}
	return files;
}

function pageKey(clientDirectory, file) {
	return relative(clientDirectory, file).split(sep).slice(0, -1).join("/");
}

function isPageKey(key) {
	if (!key) return true;
	const root = key.split("/")[0];
	return !SKIPPED_ROOTS.has(root) && !root.startsWith("_");
}

function isDetailKey(key) {
	return /^(?:blog|product)\/[^/]+$/.test(key);
}

function resolveClientDirectory(directory) {
	if (existsSync(join(directory, "index.html"))) return directory;
	const clientDirectory = join(directory, "client");
	return existsSync(join(clientDirectory, "index.html"))
		? clientDirectory
		: directory;
}

export function generateMarkdown({ clientDirectory }) {
	const markdownDirectory = join(clientDirectory, MARKDOWN_DIRECTORY);
	rmSync(markdownDirectory, { force: true, recursive: true });

	const converter = createConverter();
	const generated = [];
	const reused = [];

	for (const file of htmlFiles(clientDirectory)) {
		const key = pageKey(clientDirectory, file);
		if (!isPageKey(key)) continue;

		const html = readFileSync(file, "utf8");
		const main = extractMainContent(html);
		if (main === null) continue;

		if (isDetailKey(key) && existsSync(join(clientDirectory, `${key}.md`))) {
			reused.push(key);
			continue;
		}

		const markdown = converter.turndown(main).trim();
		if (!markdown) continue;

		const output = join(markdownDirectory, `${key || "index"}.md`);
		mkdirSync(dirname(output), { recursive: true });
		writeFileSync(output, `${markdown}\n`);
		generated.push(key || "index");
	}

	return { generated, reused };
}

export function agentMarkdownIntegration() {
	return {
		name: "agent-markdown",
		hooks: {
			"astro:build:done": async ({ dir, logger }) => {
				const clientDirectory = resolveClientDirectory(fileURLToPath(dir));
				const { generated, reused } = generateMarkdown({ clientDirectory });
				if (generated.length === 0) {
					throw new Error(`No Markdown pages generated in ${clientDirectory}`);
				}
				logger.info(
					`Generated ${generated.length} Markdown pages; kept ${reused.length} existing article Markdown files.`,
				);
			},
		},
	};
}
