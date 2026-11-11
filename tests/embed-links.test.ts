import assert from "node:assert/strict";
import { test } from "node:test";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import unifiedEmbedLinks, {
	createUnifiedEmbedLinks,
} from "../src/lib/satteri/embed-links/unified";

test("replaces Google Slides links in Astro's existing Unified pipeline", async () => {
	const file = await unified()
		.use(remarkParse)
		.use(unifiedEmbedLinks)
		.use(remarkRehype, { allowDangerousHtml: true })
		.use(rehypeStringify, { allowDangerousHtml: true })
		.process("[Slides](https://docs.google.com/presentation/d/abc123/edit)");

	assert.match(
		String(file),
		/src="https:\/\/docs\.google\.com\/presentation\/d\/abc123\/embed\?start=false&amp;loop=false&amp;delayms=3000"/,
	);
	assert.match(String(file), /title="Slides"/);
});

test("keeps the original link when an embed fetch fails", async () => {
	const file = await unified()
		.use(remarkParse)
		.use(
			createUnifiedEmbedLinks({
				fetchOembedHtml: async () => null,
			}),
		)
		.use(remarkRehype, { allowDangerousHtml: true })
		.use(rehypeStringify)
		.process("[YouTube](https://youtu.be/abc123)");

	assert.match(String(file), /href="https:\/\/youtu\.be\/abc123"/);
	assert.doesNotMatch(String(file), /youtube-embed/);
});

test("reuses the OGP cache across documents", async () => {
	let fetchCount = 0;
	const processor = unified()
		.use(remarkParse)
		.use(
			createUnifiedEmbedLinks({
				fetchOGP: async () => {
					fetchCount += 1;
					return { title: "Title", site_name: "example.com" };
				},
			}),
		)
		.use(remarkRehype, { allowDangerousHtml: true })
		.use(rehypeStringify);

	await processor.process("[One](https://example.com/article)");
	await processor.process("[Two](https://example.com/article)");

	assert.equal(fetchCount, 1);
});
