import type { CollectionEntry } from "astro:content";
import { getCollection } from "astro:content";

type PostEntry<T extends "blog" | "product"> = CollectionEntry<T> & {
	collection: T;
};

type BlogEntry = PostEntry<"blog">;
type ProductEntry = PostEntry<"product">;

export type AllPost = BlogEntry | ProductEntry;

export function shouldShowDrafts(): boolean {
	return import.meta.env.DEV || process.env.PREVIEW_DRAFTS === "true";
}

async function getPosts<T extends "blog" | "product">(
	collection: T,
): Promise<PostEntry<T>[]> {
	const posts = await getCollection(collection);
	const showDrafts = shouldShowDrafts();

	return posts
		.filter((post) => post.data.isPublish || showDrafts)
		.sort((a, b) => {
			return b.data.publishDate.getTime() - a.data.publishDate.getTime();
		})
		.map((post) => ({ ...post, collection }));
}

export function getBlogPosts(): Promise<BlogEntry[]> {
	return getPosts("blog");
}

export function getProductPosts(): Promise<ProductEntry[]> {
	return getPosts("product");
}

/**
 * @returns すべてのpostを取得する
 */
export async function getAllPosts(): Promise<AllPost[]> {
	const [blogPosts, productPosts] = await Promise.all([
		getBlogPosts(),
		getProductPosts(),
	]);

	return [...blogPosts, ...productPosts].sort((a, b) => {
		return b.data.publishDate.getTime() - a.data.publishDate.getTime();
	});
}
