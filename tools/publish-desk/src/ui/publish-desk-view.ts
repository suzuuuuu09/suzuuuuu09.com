import {
	type App,
	ItemView,
	Notice,
	TFile,
	type WorkspaceLeaf,
} from "obsidian";

import type {
	InspectionResultChannel,
	InspectionSnapshot,
} from "../application/publish-desk-inspection";
import { getContentCollection } from "../domain/content-entry";
import type { Diagnostic } from "../domain/diagnostic";
import { InspectionRefreshController } from "./inspection-refresh-controller";
import { PublishDeskRenderer } from "./publish-desk-renderer";

export const PUBLISH_DESK_VIEW_TYPE = "publish-desk-view";

export interface PublishDeskViewDependencies {
	app: App;
	inspectionService: (filePath: string) => Promise<InspectionSnapshot>;
	resultChannel: InspectionResultChannel;
}

export class PublishDeskView extends ItemView {
	private readonly controller: InspectionRefreshController;
	private readonly renderer: PublishDeskRenderer;

	constructor(
		leaf: WorkspaceLeaf,
		private readonly dependencies: PublishDeskViewDependencies,
	) {
		super(leaf);
		this.navigation = false;
		this.renderer = new PublishDeskRenderer(this.contentEl, {
			onRefresh: () => {
				void this.refreshActiveFileNow();
			},
			onOpenDiagnostic: (diagnostic) => {
				void this.openDiagnostic(diagnostic);
			},
		});
		this.controller = new InspectionRefreshController({
			inspect: (filePath) => this.dependencies.inspectionService(filePath),
			onStateChange: (state) => {
				this.renderer.render(state);
			},
			onError: (error, filePath) => {
				console.error(`Publish Desk inspection failed: ${filePath}`, error);
			},
		});
	}

	getViewType(): string {
		return PUBLISH_DESK_VIEW_TYPE;
	}

	getDisplayText(): string {
		return "Publish Desk";
	}

	getIcon(): string {
		return "clipboard-check";
	}

	async onOpen(): Promise<void> {
		this.contentEl.addClass("publish-desk-view");

		this.registerEvent(
			this.dependencies.app.workspace.on("file-open", (file) => {
				void this.controller.setTarget(this.getTargetPath(file));
			}),
		);
		this.registerEvent(
			this.dependencies.app.vault.on("modify", (file) => {
				if (file instanceof TFile) {
					this.controller.scheduleRefresh(file.path);
				}
			}),
		);
		this.registerEvent(
			this.dependencies.app.metadataCache.on("changed", (file) => {
				this.controller.scheduleRefresh(file.path);
			}),
		);
		this.register(
			this.dependencies.resultChannel.subscribe((snapshot) => {
				this.controller.acceptSnapshot(snapshot);
			}),
		);

		await this.controller.setTarget(
			this.getTargetPath(this.dependencies.app.workspace.getActiveFile()),
		);
	}

	async onClose(): Promise<void> {
		this.controller.close();
		this.contentEl.empty();
		this.contentEl.removeClass("publish-desk-view");
	}

	private getTargetPath(file: TFile | null): string | null {
		if (
			!file ||
			file.extension.toLowerCase() !== "md" ||
			!getContentCollection(file.path)
		) {
			return null;
		}
		return file.path;
	}

	private async refreshActiveFileNow(): Promise<void> {
		const activePath = this.getTargetPath(
			this.dependencies.app.workspace.getActiveFile(),
		);
		if (activePath !== this.controller.getCurrentFilePath()) {
			await this.controller.setTarget(activePath);
			return;
		}

		await this.controller.refreshNow();
	}

	private async openDiagnostic(diagnostic: Diagnostic): Promise<void> {
		const file = this.dependencies.app.vault.getAbstractFileByPath(
			diagnostic.filePath,
		);
		if (!(file instanceof TFile) || file.extension.toLowerCase() !== "md") {
			new Notice("診断対象のMarkdownファイルが見つかりません。");
			return;
		}

		try {
			const leaf = this.dependencies.app.workspace.getLeaf(false);
			await leaf.openFile(file);
		} catch (error) {
			console.error("Publish Desk could not open diagnostic target", error);
			new Notice("診断対象のファイルを開けませんでした。");
		}
	}
}
