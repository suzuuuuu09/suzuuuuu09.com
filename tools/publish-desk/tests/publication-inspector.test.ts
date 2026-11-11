import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { InMemoryContentStore } from "../src/adapters/in-memory-content-store";
import { inspectContentEntry } from "../src/application/publish-desk-inspection";
import {
	type ContentCollection,
	type ContentEntry,
	type Frontmatter,
	getContentCollection,
} from "../src/domain/content-entry";

const filePath = "src/content/blog/example.md";

function entry(
	collection: ContentCollection,
	frontmatter: Frontmatter,
	path = filePath,
): ContentEntry {
	return { collection, filePath: path, frontmatter };
}

async function inspect(contentEntry: ContentEntry, ...peers: ContentEntry[]) {
	const store = new InMemoryContentStore([contentEntry, ...peers]);
	const snapshot = await inspectContentEntry(store, contentEntry.filePath);
	return snapshot.report;
}

function codes(report: { diagnostics: { code: string }[] }): string[] {
	return report.diagnostics.map((diagnostic) => diagnostic.code);
}

describe("inspectContentEntry", () => {
	test("正常なBlogと空の任意項目はPublication checkを通過する", async () => {
		for (const fields of [
			{
				publishDate: "2026-07-29T10:00:00",
				updateDate: "2026-07-30",
				careerDate: "2026-07-29",
				careerTitle: "Career milestone",
			},
			{ careerDate: "", careerTitle: "  " },
			{ publishDate: "" },
		]) {
			const report = await inspect(
				entry("blog", {
					title: "Blog",
					slug: "blog",
					tags: [],
					description: "説明",
					isPublish: false,
					category: "work",
					...fields,
				}),
			);
			assert.deepStrictEqual(report.diagnostics, []);
		}
	});

	test("Careerの日付不正と片方だけの指定をErrorにする", async () => {
		for (const fields of [
			{ careerDate: "not-a-date", careerTitle: "Career milestone" },
			{ careerDate: "2026-07-29" },
			{ careerTitle: "Career milestone" },
			{ careerDate: null, careerTitle: "Career milestone" },
			{ careerDate: false, careerTitle: "Career milestone" },
		]) {
			const report = await inspect(
				entry("blog", {
					title: "Blog",
					slug: "blog",
					...fields,
				}),
			);
			assert.ok(codes(report).includes("blog.career.invalid"));
		}
	});

	test("Productはthumbnailか空でないcarouselの片方だけを許可する", async () => {
		const cases: [Frontmatter, string[]][] = [
			[{ thumbnail: "![[thumbnail.webp]]" }, []],
			[{ carousel: ["one.webp", "two.webp"] }, []],
			[
				{ thumbnail: "thumbnail.webp", carousel: ["one.webp"] },
				["product.media-source.invalid"],
			],
			[{}, ["product.media-source.invalid"]],
			[{ carousel: [] }, ["product.media-source.invalid"]],
		];
		for (const [fields, expected] of cases) {
			const report = await inspect(
				entry("product", {
					title: "Product",
					slug: "product",
					publishDate: "2026-07-29",
					...fields,
				}),
			);
			assert.deepStrictEqual(codes(report), expected);
		}
	});

	test("carouselに文字列以外を含むとErrorになる", async () => {
		const report = await inspect(
			entry("product", {
				title: "Product",
				slug: "product",
				carousel: ["one.webp", 2],
			}),
		);
		assert.ok(codes(report).includes("product.carousel.invalid"));
	});

	test("不正なProductの日付なら対応するErrorになる", async () => {
		for (const [fields, code] of [
			[{ publishDate: "not-a-date" }, "product.publish-date.invalid"],
			[{ updateDate: "not-a-date" }, "product.update-date.invalid"],
		] as const) {
			const report = await inspect(
				entry("product", {
					title: "Product",
					slug: "product",
					thumbnail: "thumbnail.webp",
					...fields,
				}),
			);
			assert.ok(codes(report).includes(code));
		}
	});

	test("repo相対とVault相対のContent pathだけを対象にする", () => {
		assert.strictEqual(
			getContentCollection("src/content/blog/example.md"),
			"blog",
		);
		assert.strictEqual(getContentCollection("blog/example.md"), "blog");
		assert.strictEqual(getContentCollection("notes/blog/example.md"), null);
		assert.strictEqual(getContentCollection("src/notes/blog/example.md"), null);
	});

	test("複数の問題を安定した順序で一度に返し、公開不可にする", async () => {
		const report = await inspect(
			entry("blog", {
				title: "   ",
				slug: "",
				tags: ["ok", 1],
				description: 1,
				isPublish: "false",
				category: "invalid",
				publishDate: "invalid",
				updateDate: "invalid",
			}),
		);
		assert.deepStrictEqual(codes(report), [
			"frontmatter.description.invalid",
			"frontmatter.is-publish.invalid",
			"frontmatter.slug.missing",
			"frontmatter.tags.invalid",
			"frontmatter.title.missing",
			"blog.category.invalid",
			"blog.publish-date.invalid",
			"blog.update-date.invalid",
		]);
		assert.ok(
			report.diagnostics.every(
				(diagnostic) =>
					diagnostic.severity === "error" && diagnostic.filePath === filePath,
			),
		);
		assert.strictEqual(report.state, "blocked");
	});

	test("大文字小文字と.md末尾を正規化して同じcollectionのslug重複を検出する", async () => {
		const report = await inspect(
			entry("blog", { title: "Current", slug: "Example", category: "tech" }),
			entry(
				"blog",
				{ title: "Other", slug: "example.md", category: "idea" },
				"src/content/blog/other.md",
			),
		);
		assert.ok(codes(report).includes("frontmatter.slug.duplicate"));
	});

	test("異なるcollectionの同じslugは重複Errorにならない", async () => {
		const report = await inspect(
			entry("blog", { title: "Blog", slug: "shared", category: "tech" }),
			entry(
				"product",
				{ title: "Product", slug: "shared", thumbnail: "thumb.webp" },
				"src/content/product/shared.md",
			),
		);
		assert.ok(!codes(report).includes("frontmatter.slug.duplicate"));
	});
});
