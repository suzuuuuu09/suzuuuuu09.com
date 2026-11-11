import { App, Modal } from "obsidian";

import type { Diagnostic, DiagnosticSeverity } from "../domain/diagnostic";
import type {
	InspectionReport,
	InspectionState,
} from "../domain/inspection-report";

const severityLabels: Record<DiagnosticSeverity, string> = {
	error: "エラー",
	warning: "警告",
	info: "情報",
};

const stateLabels: Record<InspectionState, string> = {
	blocked: "公開不可",
	"ready-with-warnings": "警告ありで公開可能",
	ready: "公開可能",
};

export class InspectionModal extends Modal {
	constructor(
		app: App,
		private readonly report: InspectionReport,
	) {
		super(app);
	}

	onOpen(): void {
		this.titleEl.setText("Publication check");
		this.contentEl.empty();
		this.contentEl.addClass("publish-desk-inspection-modal");

		this.renderTarget();
		this.renderResult();
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private renderTarget(): void {
		this.contentEl.createEl("h3", { text: "対象" });
		this.contentEl.createEl("code", { text: this.report.filePath });
	}

	private renderResult(): void {
		this.contentEl.createEl("h3", { text: "結果" });
		this.contentEl.createEl("p", {
			text: stateLabels[this.report.state],
		});

		const counts = this.countDiagnostics(this.report.diagnostics);
		const summary = this.contentEl.createEl("p", {
			text: `エラー: ${counts.error}　警告: ${counts.warning}　情報: ${counts.info}`,
		});
		summary.addClass("publish-desk-diagnostic-summary");

		if (this.report.diagnostics.length === 0) {
			this.contentEl.createEl("p", {
				text: "Publication checkに問題はありません。",
			});
			return;
		}

		const list = this.contentEl.createEl("ul");
		list.addClass("publish-desk-diagnostic-list");
		for (const diagnostic of this.report.diagnostics) {
			this.renderDiagnostic(list, diagnostic);
		}
	}

	private renderDiagnostic(
		list: HTMLUListElement,
		diagnostic: Diagnostic,
	): void {
		const item = list.createEl("li");
		item.addClass("publish-desk-diagnostic");
		item.createSpan({
			text: `[${severityLabels[diagnostic.severity]}] ${diagnostic.message}`,
		});
		const code = item.createEl("code", { text: diagnostic.code });
		code.addClass("publish-desk-diagnostic-code");
	}

	private countDiagnostics(
		diagnostics: readonly Diagnostic[],
	): Record<DiagnosticSeverity, number> {
		const counts: Record<DiagnosticSeverity, number> = {
			error: 0,
			warning: 0,
			info: 0,
		};
		for (const diagnostic of diagnostics) counts[diagnostic.severity] += 1;
		return counts;
	}
}
