import assert from "node:assert/strict";
import { test } from "node:test";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { unifiedCaption } from "../src/lib/satteri/caption";
import unifiedWikiLinks from "../src/lib/satteri/wiki-links/unified";

const processor = unified()
	.use(remarkParse)
	.use(unifiedWikiLinks)
	.use(remarkRehype, { allowDangerousHtml: true })
	.use(unifiedCaption)
	.use(rehypeStringify, { allowDangerousHtml: true });

test("renders the three caption classes, icons and text, including markers without a space", async () => {
	const html = String(
		await processor.process(
			"_[!image]画像の説明_\n\n_[!video] 動画の説明_\n\n_[!table] 表の説明_",
		),
	);
	for (const [type, text] of [
		["image", "画像の説明"],
		["video", "動画の説明"],
		["table", "表の説明"],
	]) {
		assert.match(
			html,
			new RegExp(
				`<figcaption class="caption caption-${type}"><svg [\\s\\S]*?</svg><span>${text}</span></figcaption>`,
			),
		);
	}
});

test("only transforms standalone plain-text captions, including after inline elements", async () => {
	const html = String(
		await processor.process(
			[
				"prefix _[!image] dropped_ suffix",
				"_[!image] **formatted**_",
				"_[!image]_",
				"[link](https://example.com)_[!image] inline_",
				"<span>prefix</span>_[!image] inline_",
				"_[!image] valid_",
			].join("\n\n"),
		),
	);

	assert.equal((html.match(/<figcaption/g) ?? []).length, 1);
	assert.match(html, /<span>valid<\/span>/);
	assert.match(html, /prefix <em>\[!image\] dropped<\/em> suffix/);
	assert.match(html, /<em>\[!image\] <strong>formatted<\/strong><\/em>/);
	assert.match(html, /<em>\[!image\]<\/em>/);
	assert.match(
		html,
		/<a href="https:\/\/example.com">link<\/a><em>\[!image\] inline<\/em>/,
	);
	assert.match(html, /<span>prefix<\/span><em>\[!image\] inline<\/em>/);
});

test("renders each caption in a document with repeated wiki media", async () => {
	const source = Array.from(
		{ length: 5 },
		(_, index) =>
			`![[fixture-${index}.webp]]\n\n_[!image] Synthetic caption ${index}_`,
	).join("\n\n");
	const html = String(await processor.process(source));
	assert.equal((html.match(/class="caption caption-image"/g) ?? []).length, 5);
});
