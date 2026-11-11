import assert from "node:assert/strict";

const base = new URL(process.argv[2] ?? "http://localhost:8787");
assert(["http:", "https:"].includes(base.protocol), "Expected an HTTP URL");

for (const [path, type, japanese] of [
	["/", "text/html"],
	["/blog/1/", "text/html"],
	["/blog/markdown-guide/", "text/html"],
	["/product/", "text/html"],
	["/rss.xml", "xml"],
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
	if (path === "/") {
		assert(
			(await response.text()).includes('id="activity"'),
			"Activity section",
		);
		assert.equal(response.headers.get("x-frame-options"), "DENY");
	}
	console.log(`OK ${path}`);
}

const activity = await fetch(new URL("/api/activity", base), {
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
console.log("OK missing route (404)");

for (const collection of ["blog", "product"]) {
	for (const path of [
		`/${collection}/private-draft-sentinel-8d729c/`,
		`/${collection}/private-draft-sentinel-8d729c.md`,
		`/api/og/${collection}/private-draft-sentinel-8d729c.png`,
	]) {
		const response = await fetch(new URL(path, base), {
			signal: AbortSignal.timeout(15000),
		});
		assert.equal(response.status, 404, "Draft fixture routes must return 404");
	}
}
console.log("OK draft fixture routes (404)");
