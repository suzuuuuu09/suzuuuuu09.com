import rss, { type RSSFeedItem } from "@astrojs/rss";
import type { APIContext } from "astro";
import { SITE_DESCRIPTION, SITE_TITLE } from "../consts/base";
import { getAllPosts } from "../lib/post";

export async function GET(context: APIContext) {
	const posts = await getAllPosts();

	const siteUrl = context.site || new URL("https://suzuuuuu09.com");

	const allItems: RSSFeedItem[] = posts.map((post): RSSFeedItem => {
		const collection = post.collection;
		return {
			title: post.data.title,
			description: post.data.description || "",
			link: `/${collection}/${post.data.slug ?? post.id}/`,
			pubDate: post.data.publishDate,
			enclosure: {
				url: new URL(
					`/api/og/${collection}/${post.data.slug}.png`,
					siteUrl,
				).toString(),
				length: 0,
				type: "image/png",
			},
		};
	});

	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: siteUrl,
		items: allItems,
	});
}
