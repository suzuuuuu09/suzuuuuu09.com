import type { ContentCollection } from "../domain/content-entry";
import type { Diagnostic, DiagnosticSeverity } from "../domain/diagnostic";
import type { InspectionState } from "../domain/inspection-report";
import {
	createPublishDeskViewModel,
	type PublicationViewState,
	type PublishDeskInspectionViewModel,
	type PublishDeskLoadState,
	type PublishDeskTargetViewModel,
} from "./publish-desk-view-model";

const collectionLabels: Record<ContentCollection, string> = {
	blog: "Blog",
	product: "Product",
};

const publicationLabels: Record<PublicationViewState, string> = {
	draft: "Draft",
	published: "Published entry",
};

const inspectionLabels: Record<InspectionState, string> = {
	blocked: "公開不可",
	"ready-with-warnings": "警告あり",
	ready: "公開可能",
};

const severityLabels: Record<DiagnosticSeverity, string> = {
	error: "エラー",
	warning: "警告",
	info: "情報",
};

export interface PublishDeskRendererActions {
	onRefresh(): void;
	onOpenDiagnostic(diagnostic: Diagnostic): void;
}

export class PublishDeskRenderer {
	constructor(
		private readonly root: HTMLElement,
		private readonly actions: PublishDeskRendererActions,
	) {}

	render(state: PublishDeskLoadState): void {
		const viewModel = createPublishDeskViewModel(state);
		this.root.empty();
		this.root.createEl("h2", {
			text: "Publish Desk",
			cls: "publish-desk-title",
		});

		if (viewModel.target.kind === "none") {
			this.renderEmptyState();
			return;
		}

		this.renderTarget(viewModel.target);
		this.renderInspection(viewModel.inspection);
		this.renderActions(viewModel.inspection);
	}

	private renderEmptyState(): void {
		const empty = this.root.createDiv({
			cls: "publish-desk-empty",
		});
		empty.createEl("p", {
			text: "Content entryを開いてください。",
			cls: "publish-desk-empty-title",
		});
		empty.createEl("p", {
			text: "Publish DeskはBlog、ProductのMarkdownファイルを対象にしています。",
		});
	}

	private renderTarget(
		target: Extract<PublishDeskTargetViewModel, { kind: "content-entry" }>,
	): void {
		const header = this.root.createEl("header", {
			cls: "publish-desk-header",
		});
		header.createEl("p", {
			text: collectionLabels[target.collection],
			cls: "publish-desk-collection",
		});
		header.createEl("h3", {
			text: target.title,
			cls: "publish-desk-entry-title",
		});
		header.createEl("p", {
			text: `slug: ${target.slug}`,
			cls: "publish-desk-slug",
		});
		header.createEl("p", {
			text: target.filePath,
			cls: "publish-desk-file-path",
		});

		const statusList = this.root.createDiv({
			cls: "publish-desk-status-list",
		});
		this.renderStatusRow(
			statusList,
			"Publication",
			target.publicationState
				? publicationLabels[target.publicationState]
				: "取得中",
		);
	}

	private renderInspection(inspection: PublishDeskInspectionViewModel): void {
		const statusList = this.root.querySelector<HTMLElement>(
			".publish-desk-status-list",
		);
		if (statusList) {
			this.renderStatusRow(
				statusList,
				"Inspection",
				this.getInspectionLabel(inspection),
			);
		}

		const section = this.root.createEl("section", {
			cls: "publish-desk-section publish-desk-diagnostics",
		});
		section.createEl("h3", { text: "Publication check" });

		if (inspection.kind === "checking") {
			section.createEl("p", { text: "検査しています。" });
			return;
		}
		if (inspection.kind === "failed") {
			section.createEl("p", {
				text: inspection.message,
				cls: "publish-desk-failure",
			});
			section.createEl("p", {
				text: "対象ファイルを確認して、再検査してください。",
				cls: "publish-desk-help",
			});
			return;
		}
		if (inspection.kind !== "completed") return;

		const summary = section.createDiv({
			cls: "publish-desk-diagnostic-summary",
		});
		for (const severity of ["error", "warning", "info"] as const) {
			const row = summary.createDiv({
				cls: "publish-desk-diagnostic-count",
			});
			row.createSpan({ text: severityLabels[severity] });
			row.createSpan({ text: String(inspection.counts[severity]) });
		}

		if (inspection.diagnostics.length === 0) {
			section.createEl("p", {
				text: "Publication checkに問題はありません。",
				cls: "publish-desk-success",
			});
			return;
		}

		section.createEl("h4", { text: "Metadata" });
		const list = section.createEl("ul", {
			cls: "publish-desk-diagnostic-list",
		});
		for (const diagnostic of inspection.diagnostics) {
			this.renderDiagnostic(list, diagnostic);
		}
	}

	private renderStatusRow(
		container: HTMLElement,
		label: string,
		value: string,
	): void {
		const row = container.createDiv({ cls: "publish-desk-status-row" });
		row.createSpan({ text: label });
		row.createSpan({ text: value });
	}

	private getInspectionLabel(
		inspection: PublishDeskInspectionViewModel,
	): string {
		if (inspection.kind === "checking") return "検査中";
		if (inspection.kind === "failed") return "検査失敗";
		if (inspection.kind === "completed") {
			return inspectionLabels[inspection.state];
		}
		return "未検査";
	}

	private renderDiagnostic(
		list: HTMLUListElement,
		diagnostic: Diagnostic,
	): void {
		const item = list.createEl("li");
		const button = item.createEl("button", {
			cls: `publish-desk-diagnostic publish-desk-diagnostic-${diagnostic.severity}`,
			attr: { type: "button" },
		});
		button.createSpan({
			text: severityLabels[diagnostic.severity],
			cls: "publish-desk-diagnostic-severity",
		});
		button.createSpan({
			text: diagnostic.message,
			cls: "publish-desk-diagnostic-message",
		});
		button.createEl("code", {
			text: diagnostic.code,
			cls: "publish-desk-diagnostic-code",
		});
		button.createSpan({
			text: diagnostic.filePath,
			cls: "publish-desk-diagnostic-path",
		});
		button.addEventListener("click", () => {
			this.actions.onOpenDiagnostic(diagnostic);
		});
	}

	private renderActions(inspection: PublishDeskInspectionViewModel): void {
		const actions = this.root.createDiv({
			cls: "publish-desk-actions",
		});
		const button = actions.createEl("button", {
			text: inspection.kind === "checking" ? "検査中" : "再検査",
			cls: "mod-cta",
			attr: {
				type: "button",
				...(inspection.kind === "checking" ? { disabled: "true" } : {}),
			},
		});
		button.addEventListener("click", () => {
			this.actions.onRefresh();
		});
	}
}
