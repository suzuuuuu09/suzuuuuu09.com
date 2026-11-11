import { type AllPost, getAllPosts } from "@/lib/post";
import { stripObsidianComments } from "@/lib/remark/remark-obsidian";

export async function getStaticPaths() {
	const entries = await getAllPosts();
	return entries.map((entry) => ({
		params: {
			collection: entry.collection,
			slug: entry.data.slug,
		},
		props: { entry },
	}));
}

export async function GET({ props }: { props: { entry: AllPost } }) {
	const { entry } = props;
	const markdown = stripObsidianComments(entry.body ?? "");

	return new Response(markdown, {
		status: 200,
		headers: {
			"Content-Type": "text/markdown; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
		},
	});
}
