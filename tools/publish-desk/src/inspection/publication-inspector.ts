import publicationRules from "../../../../src/lib/publication-rules.cjs";
import type { ContentEntry } from "../domain/content-entry";
import type { Diagnostic } from "../domain/diagnostic";

function diagnostic(
	entry: ContentEntry,
	code: string,
	message: string,
	severity: Diagnostic["severity"] = "error",
): Diagnostic {
	return {
		code,
		severity,
		message,
		filePath: entry.filePath,
	};
}

function inspectFrontmatter(entry: ContentEntry): Diagnostic[] {
	return publicationRules
		.getCollectionFrontmatterIssues(entry.collection, entry.frontmatter)
		.map((issue) => diagnostic(entry, issue.code, issue.message));
}

function inspectDuplicateSlug(
	entry: ContentEntry,
	collectionEntries: readonly ContentEntry[],
): Diagnostic[] {
	const slug = entry.frontmatter.slug;
	if (typeof slug !== "string" || slug.trim() === "") return [];

	const duplicate = publicationRules.hasDuplicateSlug({
		collection: entry.collection,
		filePath: entry.filePath,
		slug,
		entries: collectionEntries.map((candidate) => ({
			collection: candidate.collection,
			filePath: candidate.filePath,
			slug: candidate.frontmatter.slug,
		})),
		stripMarkdownExtension: true,
	});

	return duplicate
		? [
				diagnostic(
					entry,
					"frontmatter.slug.duplicate",
					`slug「${slug.trim()}」が同じ${entry.collection}内で重複しています`,
				),
			]
		: [];
}

export function inspectPublication(
	entry: ContentEntry,
	collectionEntries: readonly ContentEntry[],
): Diagnostic[] {
	return [
		...inspectFrontmatter(entry),
		...inspectDuplicateSlug(entry, collectionEntries),
	];
}
