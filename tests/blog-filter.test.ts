import assert from "node:assert/strict";
import test from "node:test";
import { getBlogPage } from "../src/lib/blog-filter";

test("blog pages paginate within the selected category and preserve order", () => {
	const posts = ["tech", "work", undefined, "tech", "idea", "tech"].map(
		(category, id) => ({ id, data: { category } }),
	);
	const visible = (category: string, page = 1) => {
		const result = getBlogPage(posts, category, page, 2);
		return { ids: result.posts.map((post) => post.id), count: result.count };
	};
	assert.deepEqual(visible("all"), { ids: [0, 1], count: 6 });
	assert.deepEqual(visible("all", 2), { ids: [2, 3], count: 6 });
	assert.deepEqual(visible("tech"), { ids: [0, 3], count: 3 });
	assert.deepEqual(visible("tech", 2), { ids: [5], count: 3 });
	assert.deepEqual(visible("private"), { ids: [], count: 0 });
});
