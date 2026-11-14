import assert from "node:assert/strict";

const target = process.argv[2] === "--" ? process.argv[3] : process.argv[2];
const base = new URL(target ?? "http://localhost:8787");
assert(["http:", "https:"].includes(base.protocol), "Expected an HTTP URL");

for (const [path, type, japanese] of [
	["/", "text/html"],
	["/blog/", "text/html"],
	["/blog/markdown-guide/", "text/html"],
	["/product/", "text/html"],
	["/rss.xml", "xml"],
	["/robots.txt", "text/plain"],
	["/sitemap-index.xml", "xml"],
	["/sitemap-0.xml", "xml"],
	["/llms.txt", "text/plain", "技術記事"],
	["/blog/markdown-guide.md", "text/markdown", "見出し"],
	["/api/og/default.png", "image/png"],
]) {
	const response = await fetch(new URL(path, base), {
		signal: AbortSignal.timeout(15_000),
	});
	assert.equal(response.status, 200, path);
	assert(response.headers.get("content-type")?.includes(type), path);
	if (japanese) {
		assert(
			/;\s*charset=utf-8(?:\s*;|$)/i.test(
				response.headers.get("content-type") ?? "",
			),
			`${path} must declare UTF-8`,
		);
		const text = new TextDecoder("utf-8", { fatal: true }).decode(
			await response.arrayBuffer(),
		);
		assert(text.includes(japanese), `${path} must preserve Japanese text`);
	}
	if (path === "/blog/markdown-guide/") {
		assert((await response.text()).includes('id="site-mermaid'), "Mermaid SVG");
	}
	if (path === "/rss.xml") {
		const xml = await response.text();
		assert.match(xml, /<rss\b/i, "RSS document");
		assert.match(xml, /<channel\b/i, "RSS channel");
	}
	if (path === "/robots.txt") {
		const robots = await response.text();
		assert.match(
			robots,
			/Content-Signal: search=yes, ai-input=yes, ai-train=no/,
		);
		assert.match(robots, /^Sitemap: https:\/\//m);
	}
	if (path === "/sitemap-index.xml") {
		assert.match(await response.text(), /<sitemapindex\b/i, "Sitemap index");
	}
	if (path === "/sitemap-0.xml") {
		assert.match(await response.text(), /<urlset\b/i, "Sitemap URL set");
	}
	if (path === "/") {
		assert(
			(await response.text()).includes('id="activity"'),
			"Activity section",
		);
		assert.equal(response.headers.get("x-frame-options"), "DENY");
	}
	console.log(`OK ${path}`);
}

const homeHtml = await fetch(new URL("/", base), {
	headers: { Accept: "text/html" },
	signal: AbortSignal.timeout(15_000),
});
assert.equal(homeHtml.status, 200, "Home HTML status");
assert.equal(
	homeHtml.headers.get("link"),
	'</llms.txt>; rel="describedby"',
	"Home describedby Link",
);
assert.match(
	homeHtml.headers.get("vary") ?? "",
	/(?:^|,\s*)accept(?:,|$)/i,
	"Home HTML Vary",
);
assert.equal(
	homeHtml.headers.get("cloudflare-cdn-cache-control"),
	"no-store",
	"Home HTML CDN cache",
);
assert.equal(
	homeHtml.headers.get("content-signal"),
	"search=yes, ai-input=yes, ai-train=no",
	"Home Content-Signal",
);
assert.equal(homeHtml.headers.get("x-robots-tag"), null, "Home is indexable");
const homeHtmlBody = await homeHtml.text();
assert.doesNotMatch(homeHtmlBody, /<meta\s+name=["']robots["'][^>]*noindex/i);
const jsonLd = homeHtmlBody.match(
	/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i,
);
assert(jsonLd, "Home Person JSON-LD");
const person = JSON.parse(jsonLd[1]);
assert.equal(person["@type"], "Person");
assert.equal(person.name, "suzu");
assert.equal(person.url, "https://suzuuuuu09.com/");
assert(person.knowsAbout.includes("Web development"));
assert(person.sameAs.includes("https://github.com/suzuuuuu09"));
console.log("OK / (Person JSON-LD and indexable HTML)");
console.log("OK / (HTML negotiation headers)");

const htmlEtag = homeHtml.headers.get("etag");
assert(htmlEtag, "Home HTML ETag");

const validatedHtml = await fetch(new URL("/", base), {
	headers: { Accept: "text/html", "If-None-Match": htmlEtag },
	signal: AbortSignal.timeout(15_000),
});
assert.equal(validatedHtml.status, 304, "HTML conditional response");
assert.match(validatedHtml.headers.get("vary") ?? "", /\baccept\b/i);
assert.equal(
	validatedHtml.headers.get("cloudflare-cdn-cache-control"),
	"no-store",
);
console.log("OK / (conditional HTML 304)");

const conditionalMarkdown = await fetch(new URL("/", base), {
	headers: {
		Accept: "text/markdown",
		"If-None-Match": htmlEtag,
		Range: "bytes=0-4",
		"If-Range": htmlEtag,
	},
	signal: AbortSignal.timeout(15_000),
});
assert.equal(
	conditionalMarkdown.status,
	200,
	"Markdown must not validate HTML ETag",
);
assert(
	conditionalMarkdown.headers.get("content-type")?.includes("text/markdown"),
);
assert.notEqual(conditionalMarkdown.headers.get("etag"), htmlEtag);
assert((await conditionalMarkdown.text()).length > 5, "Full Markdown body");
console.log("OK / (HTML validators do not affect Markdown)");

const homeMarkdown = await fetch(new URL("/", base), {
	headers: { Accept: "text/markdown" },
	signal: AbortSignal.timeout(15_000),
});
assert.equal(homeMarkdown.status, 200, "Home Markdown status");
assert(
	homeMarkdown.headers.get("content-type")?.includes("text/markdown"),
	"Home Markdown Content-Type",
);
assert.match(
	homeMarkdown.headers.get("vary") ?? "",
	/(?:^|,\s*)accept(?:,|$)/i,
	"Home Markdown Vary",
);
assert.equal(
	homeMarkdown.headers.get("link"),
	'</llms.txt>; rel="describedby"',
	"Home Markdown describedby Link",
);
assert.equal(
	homeMarkdown.headers.get("cache-control"),
	"no-store",
	"Markdown cache",
);
assert.equal(
	homeMarkdown.headers.get("cloudflare-cdn-cache-control"),
	"no-store",
	"Markdown CDN cache",
);
const homeMarkdownText = await homeMarkdown.text();
assert(homeMarkdownText.length > 0, "Home Markdown body");
assert(!homeMarkdownText.startsWith("<"), "Home Markdown must not be HTML");
console.log("OK / (text/markdown)");

const homeQ0 = await fetch(new URL("/", base), {
	headers: { Accept: "text/markdown;q=0" },
	signal: AbortSignal.timeout(15_000),
});
assert.equal(homeQ0.status, 200, "q=0 HTML status");
assert(homeQ0.headers.get("content-type")?.includes("text/html"), "q=0 HTML");
console.log("OK / (text/markdown;q=0 -> HTML)");

const homeHead = await fetch(new URL("/", base), {
	method: "HEAD",
	headers: { Accept: "text/markdown" },
	signal: AbortSignal.timeout(15_000),
});
assert.equal(homeHead.status, 200, "HEAD Markdown status");
assert(
	homeHead.headers.get("content-type")?.includes("text/markdown"),
	"HEAD Markdown Content-Type",
);
assert.equal(await homeHead.text(), "", "HEAD Markdown body");
console.log("OK / (HEAD text/markdown)");

const detailMarkdown = await fetch(new URL("/blog/markdown-guide/", base), {
	headers: { Accept: "text/markdown" },
	signal: AbortSignal.timeout(15_000),
});
assert.equal(detailMarkdown.status, 200, "Detail Markdown status");
assert(
	detailMarkdown.headers.get("content-type")?.includes("text/markdown"),
	"Detail Markdown Content-Type",
);
assert(
	(await detailMarkdown.text()).includes("見出し"),
	"Detail Markdown body",
);
console.log("OK /blog/markdown-guide/ (text/markdown)");

for (const path of [
	"/blog/",
	"/blog/category/tech/",
	"/product/",
	"/about/",
	"/privacy-policy/",
]) {
	const response = await fetch(new URL(path, base), {
		headers: { Accept: "text/markdown" },
		signal: AbortSignal.timeout(15_000),
	});
	assert.equal(response.status, 200, path);
	assert(response.headers.get("content-type")?.includes("text/markdown"), path);
	assert((await response.text()).trim().length > 0, path);
	console.log(`OK ${path} (text/markdown)`);
}

const missingMarkdown = await fetch(
	new URL("/__worker_smoke_missing__", base),
	{
		headers: { Accept: "text/markdown" },
		signal: AbortSignal.timeout(15_000),
	},
);
assert.equal(missingMarkdown.status, 404, "Missing route with Markdown Accept");
assert(
	missingMarkdown.headers.get("content-type")?.includes("text/markdown"),
	"Missing route Markdown Content-Type",
);
assert.match(
	missingMarkdown.headers.get("vary") ?? "",
	/(?:^|,\s*)accept(?:,|$)/i,
	"Missing route Vary",
);
const missingMarkdownBody = await missingMarkdown.text();
assert(
	missingMarkdownBody.length >= 20,
	"Markdown error body explains the error",
);
assert.match(missingMarkdownBody, /\[[^\]]+\]\(\/llms\.txt\)/);
console.log("OK missing route with Markdown Accept (404)");

const activity = await fetch(new URL("/api/activity", base), {
	headers: { Accept: "text/markdown" },
	signal: AbortSignal.timeout(15_000),
});
assert.equal(activity.status, 200, "Activity API status");
assert(activity.headers.get("content-type")?.includes("application/json"));
const data = await activity.json();
assert.equal(typeof data.username, "string");
assert(Number.isSafeInteger(data.total) && data.total >= 0);
assert(Array.isArray(data.weeks) && data.weeks.length > 0);
assert(data.weeks.every((week) => Array.isArray(week) && week.length === 7));
console.log("OK /api/activity (JSON)");

const missing = await fetch(new URL("/__worker_smoke_missing__", base), {
	signal: AbortSignal.timeout(15_000),
});
assert.equal(
	missing.status,
	404,
	"Missing routes must not return the home page",
);
assert.match(missing.headers.get("vary") ?? "", /\baccept\b/i);
console.log("OK missing route (404)");

for (const collection of ["blog", "product"]) {
	for (const path of [
		`/${collection}/private-draft-sentinel-8d729c/`,
		`/${collection}/private-draft-sentinel-8d729c.md`,
		`/api/og/${collection}/private-draft-sentinel-8d729c.png`,
	]) {
		const response = await fetch(new URL(path, base), {
			headers: { Accept: "text/markdown" },
			signal: AbortSignal.timeout(15000),
		});
		assert.equal(response.status, 404, "Draft fixture routes must return 404");
	}
}
console.log("OK draft fixture routes (404)");

for (const [path, location] of [
	["/blog/1/", "/blog/"],
	["/blog/category/tech/1/", "/blog/category/tech/"],
]) {
	for (const accept of ["text/html", "text/markdown"]) {
		const response = await fetch(new URL(path, base), {
			headers: { Accept: accept },
			redirect: "manual",
			signal: AbortSignal.timeout(15_000),
		});
		assert.equal(response.status, 301, `${path} (${accept})`);
		assert.equal(response.headers.get("location"), location, path);
	}
}
console.log("OK redirects retain 301 for HTML and Markdown");
