import { Notice, Plugin } from "obsidian";

import { ObsidianContentStore } from "./adapters/obsidian-content-store";
import type { InspectionSnapshot } from "./application/publish-desk-inspection";
import {
	InspectionResultChannel,
	inspectContentEntry,
} from "./application/publish-desk-inspection";
import { getContentCollection } from "./domain/content-entry";
import { InspectionModal } from "./ui/inspection-modal";
import {
	PUBLISH_DESK_VIEW_TYPE,
	PublishDeskView,
} from "./ui/publish-desk-view";

export default class PublishDeskPlugin extends Plugin {
	onload(): void {
		const contentStore = new ObsidianContentStore(this.app);
		const inspectionService = (filePath: string) =>
			inspectContentEntry(contentStore, filePath);
		const resultChannel = new InspectionResultChannel();

		this.registerView(
			PUBLISH_DESK_VIEW_TYPE,
			(leaf) =>
				new PublishDeskView(leaf, {
					app: this.app,
					inspectionService,
					resultChannel,
				}),
		);

		this.addCommand({
			id: "open-publish-desk",
			name: "Publish Deskを開く",
			callback: () => {
				void openPublishDesk(this);
			},
		});

		this.addCommand({
			id: "inspect-current-entry",
			name: "現在のContent entryを検査",
			callback: () => {
				void inspectCurrentEntry(this, inspectionService, resultChannel);
			},
		});
	}
}

async function openPublishDesk(plugin: PublishDeskPlugin): Promise<void> {
	const existingLeaves = plugin.app.workspace.getLeavesOfType(
		PUBLISH_DESK_VIEW_TYPE,
	);
	const leaf = existingLeaves[0] ?? plugin.app.workspace.getRightLeaf(false);

	if (!leaf) {
		new Notice("Publish Deskを開けませんでした。");
		return;
	}

	if (existingLeaves.length === 0) {
		await leaf.setViewState({
			type: PUBLISH_DESK_VIEW_TYPE,
			active: true,
		});
	}

	await plugin.app.workspace.revealLeaf(leaf);
}

async function inspectCurrentEntry(
	plugin: PublishDeskPlugin,
	inspectionService: (filePath: string) => Promise<InspectionSnapshot>,
	resultChannel: InspectionResultChannel,
): Promise<void> {
	const activeFile = plugin.app.workspace.getActiveFile();
	if (
		!activeFile ||
		activeFile.extension.toLowerCase() !== "md" ||
		!getContentCollection(activeFile.path)
	) {
		new Notice("Publish Deskの対象となるContent entryを開いてください。");
		return;
	}

	try {
		const snapshot = await inspectionService(activeFile.path);
		resultChannel.publish(snapshot);
		new InspectionModal(plugin.app, snapshot.report).open();
	} catch (error) {
		console.error("Publish Desk inspection failed", error);
		new Notice("Content entryの検査に失敗しました。");
	}
}
