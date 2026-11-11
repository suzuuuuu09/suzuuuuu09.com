export type ContentCollection = "blog" | "product";

export type Frontmatter = Readonly<Record<string, unknown>>;

export interface ContentEntry {
	collection: ContentCollection;
	filePath: string;
	frontmatter: Frontmatter;
}

export function getContentCollection(
	filePath: string,
): ContentCollection | null {
	const normalizedPath = filePath.replaceAll("\\", "/").replace(/^\.\//, "");
	const segments = normalizedPath.split("/");
	const collection =
		segments[0] === "src" && segments[1] === "content"
			? segments[2]
			: segments[0];

	return collection === "blog" || collection === "product" ? collection : null;
}
