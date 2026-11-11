import type { APIContext, APIRoute } from "astro";
import { generateOgImage } from "../../../../components/features/og/OgImage";
import { getAllPosts } from "../../../../lib/post";

export const getStaticPaths = async () => {
	const allPosts = await getAllPosts();

	return allPosts.map((post) => ({
		params: { collection: post.collection, title: post.data.slug },
		props: { title: post.data.title },
	}));
};

export const GET: APIRoute = async ({ params, props }: APIContext) => {
	const image = await generateOgImage(props.title, true, params.collection);
	return new Response(new Uint8Array(image), {
		headers: { "Content-Type": "image/png" },
	});
};
