// Run against an active development server: node scripts/check-blog-routes.mjs
import assert from "node:assert/strict";

const base = process.argv[2] ?? "http://localhost:4321";
for (const [path, location] of [
	["/blog/", "/blog/1/"],
	["/blog/category/tech/", "/blog/category/tech/1/"],
]) {
	const response = await fetch(new URL(path, base), {
		redirect: "manual",
	});
	assert.equal(response.status, 302);
	assert.equal(response.headers.get("location"), location);
}
for (const [path, status] of [
	["/blog/1/", 200],
	["/blog/2/", 200],
	["/blog/category/tech/1", 200],
	["/blog/category/tech/1/", 200],
	["/blog/neovim-mason-to-nix/", 200],
	["/blog/category/tech/999999/", 404],
	["/blog/__missing-route__/", 404],
	["/product/__missing-route__/", 404],
]) {
	const response = await fetch(new URL(path, base));
	assert.equal(response.status, status, path);
}
console.log("カテゴリーの1ページ目、記事、範囲外URLのHTTP応答を確認しました。");
