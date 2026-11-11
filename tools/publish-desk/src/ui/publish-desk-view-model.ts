import type { InspectionSnapshot } from "../application/publish-desk-inspection";
import {
	type ContentEntry,
	getContentCollection,
} from "../domain/content-entry";
import type { Diagnostic, DiagnosticSeverity } from "../domain/diagnostic";
import type { InspectionState } from "../domain/inspection-report";

export type PublishDeskLoadState =
	| { status: "idle" }
	| {
			status: "checking";
			filePath: string;
			previous?: InspectionSnapshot;
	  }
	| { status: "ready"; snapshot: InspectionSnapshot }
	| {
			status: "failed";
			filePath: string;
			message: string;
			previous?: InspectionSnapshot;
	  };

export type PublicationViewState = "draft" | "published";

export type PublishDeskTargetViewModel =
	| { kind: "none" }
	| {
			kind: "content-entry";
			filePath: string;
			collection: ContentEntry["collection"];
			title: string;
			slug: string;
			publicationState?: PublicationViewState;
	  };

export type PublishDeskInspectionViewModel =
	| { kind: "idle" }
	| { kind: "checking" }
	| {
			kind: "completed";
			state: InspectionState;
			counts: Record<DiagnosticSeverity, number>;
			diagnostics: readonly Diagnostic[];
	  }
	| { kind: "failed"; message: string };

export interface PublishDeskViewModel {
	target: PublishDeskTargetViewModel;
	inspection: PublishDeskInspectionViewModel;
}

export function createPublishDeskViewModel(
	state: PublishDeskLoadState,
): PublishDeskViewModel {
	if (state.status === "idle") {
		return {
			target: { kind: "none" },
			inspection: { kind: "idle" },
		};
	}

	if (state.status === "checking") {
		return {
			target: state.previous
				? createTarget(state.previous.entry)
				: createTargetFromPath(state.filePath),
			inspection: { kind: "checking" },
		};
	}

	if (state.status === "failed") {
		return {
			target: state.previous
				? createTarget(state.previous.entry)
				: createTargetFromPath(state.filePath),
			inspection: {
				kind: "failed",
				message: state.message,
			},
		};
	}

	const { entry, report } = state.snapshot;
	const counts: Record<DiagnosticSeverity, number> = {
		error: 0,
		warning: 0,
		info: 0,
	};
	for (const diagnostic of report.diagnostics) {
		counts[diagnostic.severity] += 1;
	}

	return {
		target: createTarget(entry),
		inspection: {
			kind: "completed",
			state: report.state,
			counts,
			diagnostics: report.diagnostics,
		},
	};
}

function createTarget(entry: ContentEntry): PublishDeskTargetViewModel {
	return {
		kind: "content-entry",
		filePath: entry.filePath,
		collection: entry.collection,
		title: displayText(entry.frontmatter.title, "タイトル未設定"),
		slug: displayText(entry.frontmatter.slug, "slug未設定"),
		publicationState:
			entry.frontmatter.isPublish === true ? "published" : "draft",
	};
}

function createTargetFromPath(filePath: string): PublishDeskTargetViewModel {
	const collection = getContentCollection(filePath);
	if (!collection) return { kind: "none" };

	return {
		kind: "content-entry",
		filePath,
		collection,
		title: "タイトル未設定",
		slug: "slug未設定",
	};
}

function displayText(value: unknown, fallback: string): string {
	return typeof value === "string" && value.trim() !== ""
		? value.trim()
		: fallback;
}
