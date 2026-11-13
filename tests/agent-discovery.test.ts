import assert from "node:assert/strict";
import test from "node:test";
import {
	CONTENT_SIGNAL,
	HOME_LINK,
	negotiateMarkdown,
} from "../src/lib/markdown-negotiation";

function createAssets(files: Record<string, string>) {
	return {
		async fetch(input: string | URL | Request) {
			const path = new URL(
				input instanceof Request ? input.url : input.toString(),
			).pathname;
			const body = files[path];
			if (body === undefined) {
				return new Response("Not found", { status: 404 });
			}
			return new Response(body, {
				headers: {
					"Content-Type": "text/markdown; charset=utf-8",
					ETag: '"markdown-file"',
				},
			});
		},
	};
}

function htmlResponse(
	body = '<html><main id="main-content"><p>HTML</p></main></html>',
) {
	return new Response(body, {
		headers: {
			"Content-Type": "text/html; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
			ETag: '"html-page"',
			"X-Frame-Options": "DENY",
			Vary: "Accept-Encoding",
		},
	});
}

test("homepage negotiates Markdown and annotates HTML", async () => {
	const assets = createAssets({
		"/_markdown/index.md": "# Home\n\nMain copy",
	});
	const markdown = await negotiateMarkdown(
		new Request("https://example.com/", {
			headers: { Accept: "text/markdown" },
		}),
		htmlResponse(),
		assets,
	);

	assert.equal(markdown.status, 200);
	assert.equal(
		markdown.headers.get("content-type"),
		"text/markdown; charset=utf-8",
	);
	assert.equal(await markdown.text(), "# Home\n\nMain copy");
	assert.match(markdown.headers.get("vary") ?? "", /(?:^|,\s*)accept(?:,|$)/i);
	assert.match(
		markdown.headers.get("vary") ?? "",
		/(?:^|,\s*)accept-encoding(?:,|$)/i,
	);
	assert.equal(
		markdown.headers.get("content-signal"),
		"search=yes, ai-input=yes, ai-train=no",
	);
	assert.equal(markdown.headers.get("link"), '</llms.txt>; rel="describedby"');

	const html = await negotiateMarkdown(
		new Request("https://example.com/", {
			headers: { Accept: "text/html" },
		}),
		htmlResponse(),
		assets,
	);

	assert.equal(html.status, 200);
	assert.match(html.headers.get("content-type") ?? "", /^text\/html/);
	assert.match(html.headers.get("vary") ?? "", /(?:^|,\s*)accept(?:,|$)/i);
	assert.match(
		html.headers.get("vary") ?? "",
		/(?:^|,\s*)accept-encoding(?:,|$)/i,
	);
	assert.equal(html.headers.get("cloudflare-cdn-cache-control"), "no-store");
	assert.equal(html.headers.get("link"), '</llms.txt>; rel="describedby"');
});

test("build self-check preserves authoritative Markdown and skips redirects", async () => {
	const { mkdtemp, mkdir, readFile, rm, writeFile } = await import(
		"node:fs/promises"
	);
	const { existsSync } = await import("node:fs");
	const { tmpdir } = await import("node:os");
	const { join } = await import("node:path");
	const { generateMarkdown } = await import("../scripts/generate-markdown.mjs");

	const directory = await mkdtemp(join(tmpdir(), "agent-markdown-"));
	try {
		const page = (body: string) => `<!doctype html>
			<html><body>
			<header><a href="/">Site header</a></header>
			<nav>Navigation</nav>
			<main id="main-content">${body}</main>
			<footer>Footer text</footer>
			<script>console.log("script text")</script>
			<svg><text>SVG text</text></svg>
			</body></html>`;
		const homeHtml = [
			"<h1>Homepage</h1>",
			'<p>Main copy with <a href="https://example.com">link</a>.</p>',
			'<nav aria-label="ページ"><a href="/blog/2/">Next page</a></nav>',
			'<a href="/blog/card/"><div><h2>Card title</h2><p>Card metadata</p></div></a>',
		].join("");

		await writeFile(join(directory, "index.html"), page(homeHtml));
		await mkdir(join(directory, "about"));
		await writeFile(
			join(directory, "about/index.html"),
			page("<h1>About page</h1><p>About copy.</p>"),
		);
		await writeFile(join(directory, "about.md"), "# Unrelated Markdown\n");
		await mkdir(join(directory, "blog/example"), { recursive: true });
		await writeFile(
			join(directory, "blog/example/index.html"),
			page("<h1>Example HTML</h1>"),
		);
		await writeFile(
			join(directory, "blog/example.md"),
			"# Authoritative Markdown\n",
		);
		await mkdir(join(directory, "blog/topic/post"), { recursive: true });
		await writeFile(
			join(directory, "blog/topic/post/index.html"),
			page("<h1>Nested Example HTML</h1>"),
		);
		await writeFile(
			join(directory, "blog/topic/post.md"),
			"# Nested Authoritative Markdown\n",
		);
		await mkdir(join(directory, "blog/1"), { recursive: true });
		await writeFile(
			join(directory, "blog/1/index.html"),
			'<!doctype html><title>Redirecting to: /blog/</title><meta http-equiv="refresh" content="0;url=/blog/">',
		);

		generateMarkdown({ clientDirectory: directory });

		const home = await readFile(join(directory, "_markdown/index.md"), "utf8");
		assert.match(home, /# Homepage/);
		assert.match(home, /Main copy/);
		assert.match(home, /\[link\]\(https:\/\/example\.com\)/);
		assert.match(home, /\[Next page\]\(\/blog\/2\/\)/);
		assert.match(home, /\[Card title\]\(\/blog\/card\/\)/);
		assert.match(home, /Card metadata/);
		assert.doesNotMatch(home, /## Card title/);
		assert.doesNotMatch(
			home,
			/Site header|Navigation|Footer text|script text|SVG text/,
		);

		assert.equal(
			await readFile(join(directory, "about.md"), "utf8"),
			"# Unrelated Markdown\n",
		);
		assert.match(
			await readFile(join(directory, "_markdown/about.md"), "utf8"),
			/# About page/,
		);
		assert.equal(
			await readFile(join(directory, "blog/example.md"), "utf8"),
			"# Authoritative Markdown\n",
		);
		assert.equal(
			await readFile(join(directory, "blog/topic/post.md"), "utf8"),
			"# Nested Authoritative Markdown\n",
		);
		assert.equal(
			existsSync(join(directory, "_markdown/blog/example.md")),
			false,
		);
		assert.equal(
			existsSync(join(directory, "_markdown/blog/topic/post.md")),
			false,
		);
		assert.equal(existsSync(join(directory, "_markdown/blog/1.md")), false);
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
});

test("static discovery hints match Worker response values", async () => {
	const { readFile } = await import("node:fs/promises");
	const headers = await readFile(
		new URL("../public/_headers", import.meta.url),
		"utf8",
	);
	const robots = await readFile(
		new URL("../public/robots.txt", import.meta.url),
		"utf8",
	);

	assert.ok(headers.includes(`Content-Signal: ${CONTENT_SIGNAL}`));
	assert.ok(robots.includes(`Content-Signal: ${CONTENT_SIGNAL}`));
	assert.ok(headers.includes(`Link: ${HOME_LINK}`));
});

test("detail, listing, category, and privacy pages use separate Markdown paths", async () => {
	const assets = createAssets({
		"/blog/example.md": "# Authoritative\n\n日本語の本文",
		"/product/series/example.md": "# Nested product\n\n日本語の製品情報",
		"/_markdown/blog.md": "# Blog list\n\n一覧",
		"/_markdown/blog/category/tech.md": "# Tech list\n\nカテゴリ",
		"/_markdown/privacy-policy.md": "# Privacy Policy\n\n公開ポリシー",
	});

	for (const [path, expected] of [
		["/blog/example/", "# Authoritative"],
		["/product/series/example/", "# Nested product"],
		["/blog/", "# Blog list"],
		["/blog/category/tech/", "# Tech list"],
		["/privacy-policy/", "# Privacy Policy"],
	]) {
		const response = await negotiateMarkdown(
			new Request(`https://example.com${path}`, {
				headers: { Accept: "text/markdown" },
			}),
			htmlResponse(),
			assets,
		);
		assert.equal(response.status, 200, path);
		assert.equal(
			response.headers.get("content-type"),
			"text/markdown; charset=utf-8",
			path,
		);
		assert.match(await response.text(), new RegExp(expected), path);
	}
});

test("failed Markdown asset candidates fall through to the next path", async () => {
	const response = await negotiateMarkdown(
		new Request("https://example.com/blog/example/", {
			headers: { Accept: "text/markdown" },
		}),
		htmlResponse(),
		{
			async fetch(input) {
				const path = new URL(
					input instanceof Request ? input.url : input.toString(),
				).pathname;
				if (path === "/blog/example.md") {
					throw new Error("static asset unavailable");
				}
				return new Response("# Generated fallback", {
					headers: { "Content-Type": "text/markdown; charset=utf-8" },
				});
			},
		},
	);

	assert.equal(response.status, 200);
	assert.match(await response.text(), /# Generated fallback/);
});

test("non-200 Markdown candidates release their response body", async () => {
	let cancelled = false;
	const response = await negotiateMarkdown(
		new Request("https://example.com/blog/example/", {
			headers: { Accept: "text/markdown" },
		}),
		htmlResponse(),
		{
			async fetch(input) {
				const path = new URL(
					input instanceof Request ? input.url : input.toString(),
				).pathname;
				if (path === "/blog/example.md") {
					return new Response(
						new ReadableStream({
							cancel() {
								cancelled = true;
							},
						}),
						{ status: 404 },
					);
				}
				return new Response("# Generated fallback");
			},
		},
	);

	assert.equal(response.status, 200);
	assert.match(await response.text(), /# Generated fallback/);
	assert.equal(cancelled, true);
});

test("Accept quality, wildcards, case, and q=0 select the right representation", async () => {
	const assets = createAssets({ "/_markdown/index.md": "# Markdown" });
	const cases: [string | null, boolean][] = [
		[null, false],
		["*/*", false],
		["text/html", false],
		["TEXT/MARKDOWN", true],
		["text/markdown;q=0", false],
		["text/markdown;q=0.9, text/html;q=1", false],
		["text/markdown, text/html;q=0.9", true],
		["text/markdown;q=0.5, */*;q=1", false],
	];

	for (const [accept, markdown] of cases) {
		const headers = new Headers();
		if (accept !== null) headers.set("Accept", accept);
		const response = await negotiateMarkdown(
			new Request("https://example.com/", { headers }),
			htmlResponse(),
			assets,
		);
		assert.equal(
			response.headers.get("content-type")?.startsWith("text/markdown"),
			markdown,
			String(accept),
		);
	}
});

test("HEAD and conditional requests do not leak HTML entity headers", async () => {
	const assets = {
		async fetch(input: string | URL | Request) {
			const request = input as Request;
			assert.equal(request.headers.get("if-none-match"), null);
			assert.equal(request.headers.get("range"), null);
			return new Response("# Markdown", {
				headers: {
					"Content-Type": "text/markdown; charset=utf-8",
					ETag: '"markdown-file"',
				},
			});
		},
	};
	const response = await negotiateMarkdown(
		new Request("https://example.com/", {
			method: "HEAD",
			headers: {
				Accept: "text/markdown",
				"If-None-Match": '"html-page"',
				Range: "bytes=0-4",
			},
		}),
		htmlResponse(),
		assets,
	);

	assert.equal(response.status, 200);
	assert.equal(response.headers.get("etag"), '"markdown-file"');
	assert.equal(
		response.headers.get("content-type"),
		"text/markdown; charset=utf-8",
	);
	assert.equal(await response.text(), "");
});

test("conditional HTML validation responses stay HTML and keep negotiation headers", async () => {
	const notModified = new Response(null, {
		status: 304,
		headers: {
			ETag: '"html-page"',
			Vary: "Accept-Encoding",
		},
	});
	const response = await negotiateMarkdown(
		new Request("https://example.com/", {
			headers: { Accept: "text/html", "If-None-Match": '"html-page"' },
		}),
		notModified,
		createAssets({ "/_markdown/index.md": "# Markdown" }),
	);

	assert.equal(response.status, 304);
	assert.equal(await response.text(), "");
	assert.match(response.headers.get("vary") ?? "", /(?:^|,\s*)accept(?:,|$)/i);
	assert.match(
		response.headers.get("vary") ?? "",
		/(?:^|,\s*)accept-encoding(?:,|$)/i,
	);
	assert.equal(
		response.headers.get("content-signal"),
		"search=yes, ai-input=yes, ai-train=no",
	);
	assert.equal(
		response.headers.get("cloudflare-cdn-cache-control"),
		"no-store",
	);
});

test("partial HTML responses retain their range and negotiation headers", async () => {
	const response = await negotiateMarkdown(
		new Request("https://example.com/", {
			headers: { Accept: "text/html", Range: "bytes=0-3" },
		}),
		new Response("<htm", {
			status: 206,
			headers: {
				"Content-Type": "text/html; charset=utf-8",
				"Content-Range": "bytes 0-3/100",
			},
		}),
		createAssets({}),
	);

	assert.equal(response.status, 206);
	assert.equal(await response.text(), "<htm");
	assert.equal(response.headers.get("content-range"), "bytes 0-3/100");
	assert.match(response.headers.get("vary") ?? "", /\baccept\b/i);
	assert.equal(
		response.headers.get("cloudflare-cdn-cache-control"),
		"no-store",
	);
});

test("replacing HTML with Markdown cancels the unused HTML body", async () => {
	let cancelled = false;
	const html = new Response(
		new ReadableStream({
			cancel() {
				cancelled = true;
			},
		}),
		{
			headers: {
				"Content-Type": "text/html; charset=utf-8",
				Vary: "Accept-Encoding",
			},
		},
	);
	const response = await negotiateMarkdown(
		new Request("https://example.com/", {
			headers: { Accept: "text/markdown" },
		}),
		html,
		createAssets({ "/_markdown/index.md": "# Markdown" }),
	);

	assert.equal(response.status, 200);
	assert.equal(await response.text(), "# Markdown");
	assert.equal(cancelled, true);
});

test("missing variants, redirects, and 404 responses keep their original behavior", async () => {
	const missing = await negotiateMarkdown(
		new Request("https://example.com/about/", {
			headers: { Accept: "text/markdown" },
		}),
		htmlResponse(
			'<html><main id="main-content"><p>About HTML</p></main></html>',
		),
		createAssets({}),
	);
	assert.equal(missing.status, 200);
	assert.match(missing.headers.get("content-type") ?? "", /^text\/html/);
	assert.match(await missing.text(), /About HTML/);
	assert.match(missing.headers.get("vary") ?? "", /(?:^|,\s*)accept(?:,|$)/i);

	const redirect = new Response(null, {
		status: 301,
		headers: { Location: "/blog/" },
	});
	const redirectResponse = await negotiateMarkdown(
		new Request("https://example.com/blog/1/", {
			headers: { Accept: "text/markdown" },
		}),
		redirect,
		createAssets({ "/_markdown/blog/1.md": "# Wrong" }),
	);
	assert.equal(redirectResponse.status, 301);
	assert.equal(redirectResponse.headers.get("location"), "/blog/");

	const notFound = new Response("Missing", {
		status: 404,
		headers: { "Content-Type": "text/html; charset=utf-8" },
	});
	const notFoundResponse = await negotiateMarkdown(
		new Request("https://example.com/blog/private-draft/", {
			headers: { Accept: "text/markdown" },
		}),
		notFound,
		createAssets({ "/_markdown/blog/private-draft.md": "# Leak" }),
	);
	assert.equal(notFoundResponse.status, 404);
	assert.equal(await notFoundResponse.text(), "Missing");
});
