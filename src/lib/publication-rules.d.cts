interface PublicationIssue {
	readonly code: string;
	readonly message: string;
}

interface PublicationEntry {
	readonly collection: string;
	readonly filePath: string;
	readonly slug: unknown;
}

interface DuplicateSlugOptions {
	readonly collection: string;
	readonly filePath: string;
	readonly slug: unknown;
	readonly entries: readonly PublicationEntry[];
	readonly stripMarkdownExtension?: boolean;
}

interface PublicationRules {
	getCollectionFrontmatterIssues(
		collection: string,
		frontmatter: Readonly<Record<string, unknown>>,
	): PublicationIssue[];
	getRequiredFrontmatterIssues(
		frontmatter: Readonly<Record<string, unknown>>,
	): PublicationIssue[];
	hasDuplicateSlug(options: DuplicateSlugOptions): boolean;
	hasProductMediaConflict(
		frontmatter: Readonly<Record<string, unknown>>,
	): boolean;
	normalizeSlug(
		value: string,
		options?: { stripMarkdownExtension?: boolean },
	): string;
}

declare const publicationRules: PublicationRules;

export = publicationRules;
