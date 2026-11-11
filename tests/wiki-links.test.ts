import assert from "node:assert/strict";
import { test } from "node:test";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import unifiedWikiLinks from "../src/lib/satteri/wiki-links/unified";

test("converts wiki media references and internal links in Unified", async () => {
	const file = await unified()
		.use(remarkParse)
		.use(unifiedWikiLinks)
		.use(remarkRehype, { allowDangerousHtml: true })
		.use(rehypeStringify, { allowDangerousHtml: true })
		.process(
			'Before ![[photo.webp|320x180]] and ![[clip.mp4]] and [[target|Target]] and ![[single.webp|160]].\n\n![[a&"b.webp]]',
		);
	const html = String(file);

	assert.match(
		html,
		/<img src="https:\/\/content\.suzuuuuu09\.com\/assets\/photo\.webp" alt="photo\.webp" loading="lazy" decoding="async" width="320" height="180"/,
	);
	assert.match(
		html,
		/<video src="https:\/\/content\.suzuuuuu09\.com\/assets\/clip\.mp4" controls width="100%" alt="clip\.mp4"><\/video>/,
	);
	assert.match(
		html,
		/<img src="https:\/\/content\.suzuuuuu09\.com\/assets\/single\.webp" alt="single\.webp" loading="lazy" decoding="async" width="160" sizes=/,
	);
	assert.match(html, /<a href="target">Target<\/a>/);
	assert.match(
		html,
		/src="https:\/\/content\.suzuuuuu09\.com\/assets\/a&amp;&quot;b\.webp" alt="a&amp;&quot;b\.webp"/,
	);
});
