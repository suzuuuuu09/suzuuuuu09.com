import assert from "node:assert/strict";
import { test } from "node:test";
import {
	createMarkdownProcessor,
	type UnifiedResolvedOptions,
} from "@astrojs/markdown-remark";
import type { Root } from "hast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import unifiedEmbedLinks, {
	createUnifiedEmbedLinks,
} from "../src/lib/satteri/embed-links/unified";

const config = (await import(
	new URL("../astro.config.mjs", import.meta.url).href
)) as {
	default: { markdown?: { processor?: { options: UnifiedResolvedOptions } } };
};
const options = config.default.markdown?.processor?.options;
if (!options) throw new Error("Astro Markdown processor is not configured");
const processor = await createMarkdownProcessor(options);

test("keeps all heading levels and configured captions in synthetic Markdown", async () => {
	const source = [
		...Array.from(
			{ length: 6 },
			(_, index) => `${"#".repeat(index + 1)} H${index + 1} 見出し`,
		),
		"| Column |\n| --- |\n| Value |",
		"_[!table] Synthetic table_",
		"![[fixture.webp]]",
		"_[!image] Synthetic image_",
	].join("\n\n");
	const { code: html } = await processor.render(source);

	for (let level = 1; level <= 6; level += 1) {
		assert.match(
			html,
			new RegExp(
				`<h${level} id="h${level}-見出し"><a class="heading-anchor-container" href="#h${level}-見出し"><span class="heading-anchor heading-${level}" aria-hidden="">${"#".repeat(level)}</span></a>H${level} 見出し</h${level}>`,
			),
		);
	}
	assert.equal(
		(html.match(/class="caption caption-(?:image|table|video)"/g) ?? []).length,
		2,
	);
});

test("ignores heading comments, keeps duplicate hrefs and resets slugs between documents", async () => {
	const first = await processor.render(
		"# Hello<!-- ignored -->\n\n# Hello\n\n# Hello",
	);
	const second = await processor.render("# Hello");

	assert.match(
		first.code,
		/<h1 id="hello"><a class="heading-anchor-container" href="#hello"><span class="heading-anchor heading-1" aria-hidden="">#<\/span><\/a>Hello<!-- ignored --><\/h1>/,
	);
	for (const suffix of [1, 2]) {
		assert.match(
			first.code,
			new RegExp(
				`<h1 id="hello-${suffix}"><a class="heading-anchor-container" href="#hello-${suffix}"><span class="heading-anchor heading-1" aria-hidden="">#</span></a>Hello</h1>`,
			),
		);
	}
	assert.match(second.code, /<h1 id="hello">/);
	assert.doesNotMatch(second.code, /id="hello-[12]"/);
});

test("uses the configured external-link attributes, preserves classes and leaves internal links alone", async () => {
	const addExistingClass: Plugin<[], Root> = () => (tree) => {
		visit(tree, "element", (node) => {
			if (node.properties.href === "https://with-class.example") {
				node.properties.className = ["existing-link"];
			}
		});
	};
	const processor = await createMarkdownProcessor({
		...options,
		rehypePlugins: [addExistingClass, ...options.rehypePlugins],
	});
	const { code } = await processor.render(
		[
			"[`external`](https://example.com)",
			"[absolute internal](/foo)",
			"[relative](./foo)",
			"[fragment](#section)",
			"[mailto](mailto:test@example.com)",
			"[tel](tel:+81000000000)",
			"[`existing`](https://with-class.example)",
		].join("\n\n"),
	);

	assert.equal(
		code,
		`<p><a href="https://example.com" class="external-link" rel="nofollow noopener noreferrer" target="_blank"><code>external</code></a></p>
<p><a href="/foo">absolute internal</a></p>
<p><a href="./foo">relative</a></p>
<p><a href="#section">fragment</a></p>
<p><a href="mailto:test@example.com">mailto</a></p>
<p><a href="tel:+81000000000">tel</a></p>
<p><a href="https://with-class.example" class="existing-link external-link" rel="nofollow noopener noreferrer" target="_blank"><code>existing</code></a></p>`,
	);
});

test("renders every supported embed service using synthetic URLs", async () => {
	const services = [
		"https://www.youtube.com/watch?v=fixture",
		"https://www.youtube.com/shorts/fixture",
		"https://x.com/fixture/status/123456789",
		"https://open.spotify.com/track/fixture",
		"https://docs.google.com/presentation/d/fixture/edit",
		"https://gist.github.com/fixture/123456",
		"https://codepen.io/fixture/pen/abcDEF",
		"https://fixture.hatenablog.com/entry/fixture",
		"https://note.com/fixture/n/abc123",
		"https://soundcloud.com/fixture/track",
		"https://www.reddit.com/r/fixture/comments/abc123/example/",
		"https://speakerdeck.com/fixture/example",
		"https://example.com/fixture",
	];

	const embedLinks = createUnifiedEmbedLinks({
		fetchOembedHtml: async (url) =>
			`<iframe data-oembed-url="${new URL(url).searchParams.get("url")}"></iframe>`,
		fetchOGP: async (url) => ({
			title: `Title for ${url}`,
			description: "Description",
			site_name: new URL(url).hostname,
			image: "",
			favicon: "",
		}),
	});
	const processor = await createMarkdownProcessor({
		...options,
		remarkPlugins: options.remarkPlugins.map((plugin) =>
			plugin === unifiedEmbedLinks ? embedLinks : plugin,
		),
	});
	for (const url of services) {
		const { code } = await processor.render(url);
		assert.match(code, /<(?:iframe|script|a|div|blockquote)\b/, url);
	}
});
