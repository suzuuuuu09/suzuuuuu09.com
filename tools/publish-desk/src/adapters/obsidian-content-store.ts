import { App, TFile } from "obsidian";

import {
	type ContentCollection,
	type ContentEntry,
	getContentCollection,
} from "../domain/content-entry";
import type { ContentStore } from "./content-store";

export class ObsidianContentStore implements ContentStore {
	constructor(private readonly app: App) {}

	async read(filePath: string): Promise<ContentEntry | null> {
		const abstractFile = this.app.vault.getAbstractFileByPath(filePath);
		if (!(abstractFile instanceof TFile)) return null;

		return this.toContentEntry(abstractFile);
	}

	async list(collection: ContentCollection): Promise<ContentEntry[]> {
		return this.app.vault
			.getMarkdownFiles()
			.filter((file) => getContentCollection(file.path) === collection)
			.flatMap((file) => {
				const entry = this.toContentEntry(file);
				return entry ? [entry] : [];
			});
	}

	private toContentEntry(file: TFile): ContentEntry | null {
		const collection = getContentCollection(file.path);
		if (!collection || file.extension.toLowerCase() !== "md") return null;

		return {
			collection,
			filePath: file.path,
			frontmatter: this.app.metadataCache.getFileCache(file)?.frontmatter ?? {},
		};
	}
}
