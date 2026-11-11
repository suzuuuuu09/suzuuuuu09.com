import type { ContentStore } from "../adapters/content-store";
import type { ContentEntry } from "../domain/content-entry";
import {
	createInspectionReport,
	type InspectionReport,
} from "../domain/inspection-report";
import { inspectPublication } from "../inspection/publication-inspector";

export interface InspectionSnapshot {
	entry: ContentEntry;
	report: InspectionReport;
}

export class ContentEntryUnavailableError extends Error {
	constructor(filePath: string) {
		super(`Content entry is unavailable: ${filePath}`);
		this.name = "ContentEntryUnavailableError";
	}
}

export async function inspectContentEntry(
	contentStore: ContentStore,
	filePath: string,
): Promise<InspectionSnapshot> {
	const entry = await contentStore.read(filePath);
	if (!entry) throw new ContentEntryUnavailableError(filePath);

	const collectionEntries = await contentStore.list(entry.collection);
	const report = createInspectionReport({
		filePath: entry.filePath,
		collection: entry.collection,
		diagnostics: inspectPublication(entry, collectionEntries),
	});

	return { entry, report };
}

type InspectionResultListener = (snapshot: InspectionSnapshot) => void;

export class InspectionResultChannel {
	private readonly listeners = new Set<InspectionResultListener>();

	publish(snapshot: InspectionSnapshot): void {
		for (const listener of this.listeners) listener(snapshot);
	}

	subscribe(listener: InspectionResultListener): () => void {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	}
}
