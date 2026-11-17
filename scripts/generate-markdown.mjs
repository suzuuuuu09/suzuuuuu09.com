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
import { createDocument } from "@mixmark-io/domino";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

const MARKDOWN_DIRECTORY = "_markdown";
const SKIPPED_ROOTS = new Set(["_astro", "api", "~partytown"]);
const DISCARDED_TAGS = new Set([
	"script",
	"style",
	"svg",
	"header",
	"footer",
	"form",
	"button",
	"noscript",
	"iframe",
]);

function createConverter() {
	const turndown = new TurndownService({
		headingStyle: "atx",
		codeBlockStyle: "fenced",
		bulletListMarker: "-",
	});
	turndown.use(gfm);
	turndown.addRule("discardUi", {
		filter: (node) =>
			DISCARDED_TAGS.has(node.nodeName.toLowerCase()) ||
			(node.getAttribute?.("class") ?? "").includes("heading-anchor-container"),
		replacement: () => "",
	});
	turndown.addRule("cardLink", {
		filter: (node) =>
			node.nodeName.toLowerCase() === "a" &&
			Boolean(node.querySelector("h1, h2, h3, h4, h5, h6")),
		replacement: (content, node) => {
			const heading = node.querySelector("h1, h2, h3, h4, h5, h6");
			const href = node.getAttribute("href");
			const title = heading
				? headingText(heading).replace(/\s+/g, " ").trim()
				: "";
			if (!title || !href) return content;

			const label = title.replace(/[\\`*_{}\[\]()#+.!|<>~-]/g, "\\$&");
			const destination = href.replace(/([()])/g, "\\$1");
			const link = `[${label}](${destination})`;
			const metadata = content
				.replace(/(^|\n{1,2})#{1,6}[ \t]+[^\n]*(?=\n|$)/, "")
				.trim();

			return metadata ? `${link}\n\n${metadata}` : link;
		},
	});
	return turndown;
}

function headingText(node) {
	const heading = node.cloneNode(true);
	for (const anchor of heading.querySelectorAll(".heading-anchor-container")) {
		anchor.parentNode?.removeChild(anchor);
	}
	return heading.textContent ?? "";
}

function extractMainContent(html) {
	const document = createDocument(html);
	if (document.querySelector('meta[http-equiv="refresh" i]')) return null;
	return document.querySelector("main#main-content");
}

function htmlFiles(directory) {
	return readdirSync(directory, { recursive: true, withFileTypes: true })
		.filter((entry) => entry.isFile() && entry.name === "index.html")
		.map((entry) => join(entry.parentPath, entry.name))
		.sort((a, b) => a.localeCompare(b));
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
	return /^(?:blog|product)\/.+$/.test(key);
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
	let generated = 0;
	let reused = 0;

	for (const file of htmlFiles(clientDirectory)) {
		const key = pageKey(clientDirectory, file);
		if (!isPageKey(key)) continue;

		const html = readFileSync(file, "utf8");
		const main = extractMainContent(html);
		if (main === null) continue;

		if (isDetailKey(key) && existsSync(join(clientDirectory, `${key}.md`))) {
			reused++;
			continue;
		}

		const markdown = converter.turndown(main).trim();
		if (!markdown) continue;

		const output = join(markdownDirectory, `${key || "index"}.md`);
		mkdirSync(dirname(output), { recursive: true });
		writeFileSync(output, `${markdown}\n`);
		generated++;
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
				if (generated === 0) {
					throw new Error(`No Markdown pages generated in ${clientDirectory}`);
				}
				logger.info(
					`Generated ${generated} Markdown pages; kept ${reused} existing article Markdown files.`,
				);
			},
		},
	};
}
