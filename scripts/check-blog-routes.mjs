// Run against an active development server: node scripts/check-blog-routes.mjs
import assert from "node:assert/strict";

const base = process.argv[2] ?? "http://localhost:4321";
for (const path of [
	"/blog/",
	"/blog/category/tech/",
	"/blog/2/",
	"/blog/neovim-mason-to-nix/",
]) {
	const response = await fetch(new URL(path, base));
	assert.equal(response.status, 200, path);
}
for (const [path, location] of [
	["/blog/1/", "/blog/"],
	["/blog/category/tech/1", "/blog/category/tech/"],
	["/blog/category/tech/1/", "/blog/category/tech/"],
]) {
	const response = await fetch(new URL(path, base), {
		redirect: "manual",
	});
	assert.equal(response.status, 301, path);
	assert.equal(response.headers.get("location"), location, path);
}
for (const [path, status] of [
	["/blog/category/tech/999999/", 404],
	["/blog/__missing-route__/", 404],
	["/product/__missing-route__/", 404],
]) {
	const response = await fetch(new URL(path, base));
	assert.equal(response.status, status, path);
}
console.log(
	"1ページ目のURL、恒久リダイレクト、記事、範囲外URLのHTTP応答を確認しました。",
);
