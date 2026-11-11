import {
	ContentEntryUnavailableError,
	type InspectionSnapshot,
} from "../application/publish-desk-inspection";
import type { PublishDeskLoadState } from "./publish-desk-view-model";

export type InspectionRefreshState = PublishDeskLoadState;

export interface InspectionScheduler {
	schedule(callback: () => void, delayMs: number): unknown;
	cancel(handle: unknown): void;
}

export interface InspectionRefreshControllerOptions {
	inspect(filePath: string): Promise<InspectionSnapshot>;
	onStateChange(state: InspectionRefreshState): void;
	onError?(error: unknown, filePath: string): void;
	scheduler?: InspectionScheduler;
	debounceMs?: number;
}

const defaultScheduler: InspectionScheduler = {
	schedule: (callback, delayMs) => globalThis.setTimeout(callback, delayMs),
	cancel: (handle) =>
		globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
};

export class InspectionRefreshController {
	private readonly inspect: InspectionRefreshControllerOptions["inspect"];
	private readonly onStateChange: InspectionRefreshControllerOptions["onStateChange"];
	private readonly onError?: InspectionRefreshControllerOptions["onError"];
	private readonly scheduler: InspectionScheduler;
	private readonly debounceMs: number;
	private currentFilePath: string | null = null;
	private previous: InspectionSnapshot | undefined;
	private latestRequestId = 0;
	private scheduledHandle: unknown;
	private closed = false;

	constructor(options: InspectionRefreshControllerOptions) {
		this.inspect = options.inspect;
		this.onStateChange = options.onStateChange;
		this.onError = options.onError;
		this.scheduler = options.scheduler ?? defaultScheduler;
		this.debounceMs = options.debounceMs ?? 500;
	}

	getCurrentFilePath(): string | null {
		return this.currentFilePath;
	}

	setTarget(filePath: string | null): Promise<void> {
		if (this.closed) return Promise.resolve();
		if (filePath !== null && this.currentFilePath === filePath) {
			return Promise.resolve();
		}

		this.cancelScheduled();
		this.latestRequestId += 1;

		if (filePath === null) {
			this.currentFilePath = null;
			this.previous = undefined;
			this.onStateChange({ status: "idle" });
			return Promise.resolve();
		}

		this.currentFilePath = filePath;
		this.previous = undefined;
		return this.run(filePath);
	}

	scheduleRefresh(filePath: string): void {
		if (this.closed || filePath !== this.currentFilePath) return;

		this.cancelScheduled();
		this.scheduledHandle = this.scheduler.schedule(() => {
			this.scheduledHandle = undefined;
			void this.run(filePath);
		}, this.debounceMs);
	}

	refreshNow(): Promise<void> {
		this.cancelScheduled();
		if (this.closed || this.currentFilePath === null) {
			return Promise.resolve();
		}

		return this.run(this.currentFilePath);
	}

	acceptSnapshot(snapshot: InspectionSnapshot): void {
		if (
			this.closed ||
			snapshot.entry.filePath !== this.currentFilePath ||
			snapshot.report.filePath !== this.currentFilePath
		) {
			return;
		}

		this.cancelScheduled();
		this.latestRequestId += 1;
		this.previous = snapshot;
		this.onStateChange({ status: "ready", snapshot });
	}

	close(): void {
		this.closed = true;
		this.currentFilePath = null;
		this.previous = undefined;
		this.latestRequestId += 1;
		this.cancelScheduled();
	}

	private async run(filePath: string): Promise<void> {
		const requestId = ++this.latestRequestId;
		this.onStateChange({
			status: "checking",
			filePath,
			previous: this.previous,
		});

		try {
			const snapshot = await this.inspect(filePath);
			if (!this.canApply(requestId, filePath)) return;

			this.previous = snapshot;
			this.onStateChange({ status: "ready", snapshot });
		} catch (error) {
			if (!this.canApply(requestId, filePath)) return;

			this.onError?.(error, filePath);
			this.onStateChange({
				status: "failed",
				filePath,
				message:
					error instanceof ContentEntryUnavailableError
						? "対象ファイルが見つかりません。削除または移動された可能性があります。"
						: "Content entryの検査に失敗しました。",
				previous: this.previous,
			});
		}
	}

	private canApply(requestId: number, filePath: string): boolean {
		return (
			!this.closed &&
			requestId === this.latestRequestId &&
			filePath === this.currentFilePath
		);
	}

	private cancelScheduled(): void {
		if (this.scheduledHandle === undefined) return;
		this.scheduler.cancel(this.scheduledHandle);
		this.scheduledHandle = undefined;
	}
}
