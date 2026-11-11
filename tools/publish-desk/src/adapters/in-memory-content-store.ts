import type { ContentCollection, ContentEntry } from "../domain/content-entry";
import type { ContentStore } from "./content-store";

export class InMemoryContentStore implements ContentStore {
	private readonly entries: ContentEntry[];

	constructor(entries: readonly ContentEntry[] = []) {
		this.entries = [...entries];
	}

	async read(filePath: string): Promise<ContentEntry | null> {
		return this.entries.find((entry) => entry.filePath === filePath) ?? null;
	}

	async list(collection: ContentCollection): Promise<ContentEntry[]> {
		return this.entries.filter((entry) => entry.collection === collection);
	}
}
