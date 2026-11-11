export function getBlogPage<T extends { data: { category?: string } }>(
	posts: T[],
	category: string,
	page: number,
	pageSize: number,
) {
	const matches =
		category === "all"
			? posts
			: posts.filter((post) => post.data.category === category);
	return {
		posts: matches.slice((page - 1) * pageSize, page * pageSize),
		count: matches.length,
	};
}
