import assert from "node:assert/strict";
import { test } from "node:test";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import remarkObsidian, {
	stripObsidianComments,
} from "../src/lib/remark/remark-obsidian.ts";

const processor = unified()
	.use(remarkParse)
	.use(remarkObsidian)
	.use(remarkRehype)
	.use(rehypeStringify);

test("parses Obsidian marks and removes comments without touching protected syntax", async () => {
	const markdown = [
		"==marked **text**== and %%secret [link](https://example.com)%%",
		"`==code== %%code-comment%%`",
		"\\==literal== \\%%literal%%",
		"==cross %%comment== remains%%",
	].join("\n\n");

	const html = String(await processor.process(markdown));

	assert.strictEqual(
		html,
		"<p><mark>marked <strong>text</strong></mark> and </p>\n<p><code>==code== %%code-comment%%</code></p>\n<p>==literal== %%literal%%</p>\n<p>==cross %%comment== remains%%</p>",
	);
	assert.strictEqual(
		stripObsidianComments(markdown),
		[
			"==marked **text**== and ",
			"`==code== %%code-comment%%`",
			"\\==literal== \\%%literal%%",
			"==cross %%comment== remains%%",
		].join("\n\n"),
	);

	const nested = String(
		await processor.process("==visible %%secret **text**%% remains=="),
	);
	assert.strictEqual(nested, "<p><mark>visible  remains</mark></p>");

	const adjacent = String(await processor.process("==a==x==b=="));
	assert.strictEqual(adjacent, "<p><mark>a</mark>x<mark>b</mark></p>");

	const reverseCrossing = String(
		await processor.process("%%comment ==mark%% remains=="),
	);
	assert.strictEqual(reverseCrossing, "<p>%%comment ==mark%% remains==</p>");

	const literal = String(
		await processor.process("==== =single= ==unclosed\nline=="),
	);
	assert.strictEqual(literal, "<p>==== =single= ==unclosed\nline==</p>");

	const protectedMarkdown =
		"==[link](https://example.com/%%url)==\n\n```md\n%%code%%\n```";
	const protectedHtml = String(await processor.process(protectedMarkdown));
	assert.ok(protectedHtml.includes('<mark><a href="https://example.com/'));
	assert.ok(
		protectedHtml.includes(
			'<pre><code class="language-md">%%code%%\n</code></pre>',
		),
	);
	assert.strictEqual(
		stripObsidianComments(protectedMarkdown),
		protectedMarkdown,
	);
});
