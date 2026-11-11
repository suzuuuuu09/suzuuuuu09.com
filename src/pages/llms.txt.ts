import type { APIRoute } from "astro";
import { SITE_TITLE } from "@/consts/base";
import { type AllPost, getAllPosts } from "@/lib/post";

type Collection = AllPost["collection"];

const sectionTitles: Record<Collection, string> = {
	blog: "Blog",
	product: "Products",
};

const collectionOrder: Collection[] = ["blog", "product"];

function normalizeDescription(description: string | null | undefined) {
	return description?.replace(/\s+/g, " ").trim() ?? "";
}

export const GET = (async ({ site }) => {
	if (!site) {
		throw new Error("astro.config.mjs に site を設定してください");
	}

	const posts = await getAllPosts();

	const lines = [
		`# ${SITE_TITLE}`,
		"",
		"> 技術記事、制作物、経歴を掲載している個人サイトです。",
		"",
		"## Main pages",
		"",
		`- [Home](${new URL("/", site)})`,
		`- [Blog](${new URL("/blog/", site)})`,
		`- [Products](${new URL("/product/", site)})`,
	];

	for (const collection of collectionOrder) {
		const entries = posts.filter((post) => post.collection === collection);

		if (entries.length === 0) {
			continue;
		}

		lines.push("", `## ${sectionTitles[collection]}`, "");

		for (const entry of entries) {
			const markdownUrl = new URL(`/${collection}/${entry.data.slug}.md`, site);

			const description = normalizeDescription(entry.data.description);

			lines.push(
				description
					? `- [${entry.data.title}](${markdownUrl}): ${description}`
					: `- [${entry.data.title}](${markdownUrl})`,
			);
		}
	}

	lines.push("");

	return new Response(lines.join("\n"), {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
		},
	});
}) satisfies APIRoute;
