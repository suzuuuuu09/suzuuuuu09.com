import assert from "node:assert/strict";
import { describe, test } from "node:test";

import type { InspectionSnapshot } from "../src/application/publish-desk-inspection";
import type { ContentEntry } from "../src/domain/content-entry";
import type { Diagnostic } from "../src/domain/diagnostic";
import { createInspectionReport } from "../src/domain/inspection-report";
import { createPublishDeskViewModel } from "../src/ui/publish-desk-view-model";

const filePath = "src/content/blog/example.md";

function snapshot(
	frontmatter: ContentEntry["frontmatter"],
	diagnostics: readonly Diagnostic[] = [],
): InspectionSnapshot {
	return {
		entry: {
			collection: "blog",
			filePath,
			frontmatter,
		},
		report: createInspectionReport({
			filePath,
			collection: "blog",
			diagnostics,
		}),
	};
}

function diagnostic(
	code: string,
	severity: Diagnostic["severity"],
): Diagnostic {
	return {
		code,
		severity,
		message: `${severity}: ${code}`,
		filePath,
	};
}

describe("createPublishDeskViewModel", () => {
	test("対象外ファイルではContent entryの案内状態になる", () => {
		assert.deepStrictEqual(createPublishDeskViewModel({ status: "idle" }), {
			target: { kind: "none" },
			inspection: { kind: "idle" },
		});
	});

	test("Publication stateと未設定title・slugを表示する", () => {
		for (const [frontmatter, expected] of [
			[
				{ title: "", slug: null },
				{
					title: "タイトル未設定",
					slug: "slug未設定",
					publicationState: "draft",
				},
			],
			[
				{ title: "Draft", slug: "draft", isPublish: false },
				{ title: "Draft", slug: "draft", publicationState: "draft" },
			],
			[
				{ title: "Published", slug: "published", isPublish: true },
				{
					title: "Published",
					slug: "published",
					publicationState: "published",
				},
			],
		] as const) {
			const viewModel = createPublishDeskViewModel({
				status: "ready",
				snapshot: snapshot(frontmatter),
			});
			assert.partialDeepStrictEqual(viewModel.target, {
				kind: "content-entry",
				...expected,
			});
		}
	});

	test("警告だけと診断なしのInspection stateをcompleted viewへ渡す", () => {
		for (const [state, diagnostics] of [
			[
				"ready-with-warnings",
				[diagnostic("frontmatter.description.recommended", "warning")],
			],
			["ready", []],
		] as const) {
			const viewModel = createPublishDeskViewModel({
				status: "ready",
				snapshot: snapshot({ title: "State", slug: "state" }, diagnostics),
			});
			assert.partialDeepStrictEqual(viewModel.inspection, {
				kind: "completed",
				state,
			});
		}
	});

	test("診断の順序とseverity別件数を保持し、ErrorをWarningより優先する", () => {
		const reportSnapshot = snapshot({ title: "Counts", slug: "counts" }, [
			diagnostic("frontmatter.tags.recommended", "info"),
			diagnostic("frontmatter.description.recommended", "warning"),
			diagnostic("frontmatter.title.missing", "error"),
			diagnostic("frontmatter.slug.missing", "error"),
		]);
		const viewModel = createPublishDeskViewModel({
			status: "ready",
			snapshot: reportSnapshot,
		});
		assert.deepStrictEqual(viewModel.inspection, {
			kind: "completed",
			state: "blocked",
			counts: { error: 2, warning: 1, info: 1 },
			diagnostics: reportSnapshot.report.diagnostics,
		});
	});

	test("検査実行失敗をblockedと混同しない", () => {
		const viewModel = createPublishDeskViewModel({
			status: "failed",
			filePath,
			message: "Content entryの検査に失敗しました。",
		});
		assert.deepStrictEqual(viewModel.inspection, {
			kind: "failed",
			message: "Content entryの検査に失敗しました。",
		});
	});
});
