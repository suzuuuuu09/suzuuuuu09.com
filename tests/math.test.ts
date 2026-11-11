import assert from "node:assert/strict";
import { test } from "node:test";
import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { containsMath } from "../src/lib/math";
import unifiedSatteriKatex from "../src/lib/satteri/katex/unified";

test("keeps inline and block KaTeX HTML and renders parse errors through Astro Unified", async () => {
	const legacy = await createMarkdownProcessor({
		remarkPlugins: [remarkMath],
		rehypePlugins: [rehypeKatex],
	});
	const migrated = await createMarkdownProcessor({
		remarkPlugins: [remarkMath, unifiedSatteriKatex],
	});
	for (const source of ["Energy $E = mc^2$.", "$$\n\\int_a^b f(x) \\,dx\n$$"]) {
		assert.equal(
			(await migrated.render(source)).code,
			(await legacy.render(source)).code,
		);
	}
	const { code } = await migrated.render(String.raw`$\notacommand$`);
	assert.match(code, /class="katex-error"/);
	assert.match(code, /\\notacommand/);
});

test("detects math while ignoring code and unmatched dollars", () => {
	for (const [source, expected] of [
		["価格は $100 です。", false],
		["`$x$` と ```\n$y$\n```", false],
		["Blog $x$", true],
		["Product $$\ny=x\n$$", true],
		["Award plain text", false],
	] as const) {
		assert.equal(containsMath(source), expected);
	}
});
