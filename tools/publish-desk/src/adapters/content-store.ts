import type { ContentCollection, ContentEntry } from "../domain/content-entry";

export interface ContentStore {
	read(filePath: string): Promise<ContentEntry | null>;
	list(collection: ContentCollection): Promise<ContentEntry[]>;
}
