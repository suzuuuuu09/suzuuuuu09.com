export type DiagnosticSeverity = "error" | "warning" | "info";

export interface Diagnostic {
	code: string;
	severity: DiagnosticSeverity;
	message: string;
	filePath: string;
}

const severityOrder: Record<DiagnosticSeverity, number> = {
	error: 0,
	warning: 1,
	info: 2,
};

const categoryOrder: Record<string, number> = {
	frontmatter: 0,
	blog: 1,
	product: 2,
};

function compareStrings(left: string, right: string): number {
	if (left < right) return -1;
	if (left > right) return 1;
	return 0;
}

function diagnosticCategory(code: string): string {
	return code.split(".")[0] ?? code;
}

export function sortDiagnostics(
	diagnostics: readonly Diagnostic[],
): Diagnostic[] {
	return [...diagnostics].sort((left, right) => {
		const severityDifference =
			severityOrder[left.severity] - severityOrder[right.severity];
		if (severityDifference !== 0) return severityDifference;

		const leftCategory = diagnosticCategory(left.code);
		const rightCategory = diagnosticCategory(right.code);
		const leftCategoryOrder =
			categoryOrder[leftCategory] ?? Number.MAX_SAFE_INTEGER;
		const rightCategoryOrder =
			categoryOrder[rightCategory] ?? Number.MAX_SAFE_INTEGER;
		const categoryDifference =
			leftCategoryOrder - rightCategoryOrder ||
			compareStrings(leftCategory, rightCategory);
		if (categoryDifference !== 0) return categoryDifference;

		const codeDifference = compareStrings(left.code, right.code);
		if (codeDifference !== 0) return codeDifference;

		const pathDifference = compareStrings(left.filePath, right.filePath);
		if (pathDifference !== 0) return pathDifference;

		return compareStrings(left.message, right.message);
	});
}
