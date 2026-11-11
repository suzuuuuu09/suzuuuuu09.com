import type { ContentCollection } from "./content-entry";
import { type Diagnostic, sortDiagnostics } from "./diagnostic";

export type InspectionState = "blocked" | "ready-with-warnings" | "ready";

export interface InspectionReport {
	filePath: string;
	collection: ContentCollection;
	diagnostics: Diagnostic[];
	state: InspectionState;
}

export function deriveInspectionState(
	diagnostics: readonly Diagnostic[],
): InspectionState {
	if (diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
		return "blocked";
	}
	if (diagnostics.some((diagnostic) => diagnostic.severity === "warning")) {
		return "ready-with-warnings";
	}
	return "ready";
}

export function createInspectionReport(args: {
	filePath: string;
	collection: ContentCollection;
	diagnostics: readonly Diagnostic[];
}): InspectionReport {
	const diagnostics = sortDiagnostics(args.diagnostics);

	return {
		filePath: args.filePath,
		collection: args.collection,
		diagnostics,
		state: deriveInspectionState(diagnostics),
	};
}
