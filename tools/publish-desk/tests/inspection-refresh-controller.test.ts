import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
	ContentEntryUnavailableError,
	type InspectionSnapshot,
} from "../src/application/publish-desk-inspection";
import { createInspectionReport } from "../src/domain/inspection-report";
import {
	InspectionRefreshController,
	type InspectionRefreshState,
	type InspectionScheduler,
} from "../src/ui/inspection-refresh-controller";

const blogPath = "src/content/blog/blog.md";
const productPath = "src/content/product/product.md";

function snapshot(filePath: string): InspectionSnapshot {
	const collection = filePath.includes("/product/") ? "product" : "blog";
	return {
		entry: {
			collection,
			filePath,
			frontmatter: {
				title: collection,
				slug: collection,
				...(collection === "product" ? { thumbnail: "thumbnail.webp" } : {}),
			},
		},
		report: createInspectionReport({
			filePath,
			collection,
			diagnostics: [],
		}),
	};
}

function deferred<T>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((resolvePromise) => {
		resolve = resolvePromise;
	});
	return { promise, resolve };
}

class ManualScheduler implements InspectionScheduler {
	private nextId = 0;
	private readonly callbacks = new Map<number, () => void>();

	schedule(callback: () => void): unknown {
		const id = ++this.nextId;
		this.callbacks.set(id, callback);
		return id;
	}

	cancel(handle: unknown): void {
		this.callbacks.delete(handle as number);
	}

	runAll(): void {
		const callbacks = [...this.callbacks.values()];
		this.callbacks.clear();
		for (const callback of callbacks) callback();
	}
}

describe("InspectionRefreshController", () => {
	test("古い検査結果が新しい対象を上書きしない", async () => {
		const blog = deferred<InspectionSnapshot>();
		const product = deferred<InspectionSnapshot>();
		const states: InspectionRefreshState[] = [];
		const controller = new InspectionRefreshController({
			inspect: (filePath) =>
				filePath === blogPath ? blog.promise : product.promise,
			onStateChange: (state) => states.push(state),
		});

		const blogInspection = controller.setTarget(blogPath);
		const productInspection = controller.setTarget(productPath);

		product.resolve(snapshot(productPath));
		await productInspection;
		blog.resolve(snapshot(blogPath));
		await blogInspection;

		assert.partialDeepStrictEqual(states.at(-1), {
			status: "ready",
			snapshot: { entry: { filePath: productPath } },
		});
	});

	test("ビューを閉じた後に完了した結果を反映しない", async () => {
		const inspection = deferred<InspectionSnapshot>();
		const states: InspectionRefreshState[] = [];
		const controller = new InspectionRefreshController({
			inspect: () => inspection.promise,
			onStateChange: (state) => states.push(state),
		});

		const pending = controller.setTarget(blogPath);
		controller.close();
		inspection.resolve(snapshot(blogPath));
		await pending;

		assert.deepStrictEqual(
			states.map((state) => state.status),
			["checking"],
		);
	});

	test("手動再検査は予約済みの自動検査をキャンセルする", async () => {
		const scheduler = new ManualScheduler();
		let inspectionCount = 0;
		const controller = new InspectionRefreshController({
			inspect: async (filePath) => {
				inspectionCount += 1;
				return snapshot(filePath);
			},
			onStateChange: () => {},
			scheduler,
		});

		await controller.setTarget(blogPath);
		controller.scheduleRefresh(blogPath);

		await controller.refreshNow();
		scheduler.runAll();
		assert.strictEqual(inspectionCount, 2);
	});

	test("同じファイルの連続更新を一回の自動検査へまとめる", async () => {
		const scheduler = new ManualScheduler();
		let inspectionCount = 0;
		const controller = new InspectionRefreshController({
			inspect: async (filePath) => {
				inspectionCount += 1;
				return snapshot(filePath);
			},
			onStateChange: () => {},
			scheduler,
		});

		await controller.setTarget(blogPath);
		controller.scheduleRefresh(blogPath);
		controller.scheduleRefresh(blogPath);
		controller.scheduleRefresh(blogPath);

		scheduler.runAll();
		assert.strictEqual(inspectionCount, 2);
	});

	test("共有されたコマンド結果は現在の対象だけへ反映する", async () => {
		const states: InspectionRefreshState[] = [];
		const controller = new InspectionRefreshController({
			inspect: async (filePath) => snapshot(filePath),
			onStateChange: (state) => states.push(state),
		});

		await controller.setTarget(blogPath);
		controller.acceptSnapshot(snapshot(productPath));
		assert.partialDeepStrictEqual(states.at(-1), {
			status: "ready",
			snapshot: { entry: { filePath: blogPath } },
		});

		const updated = snapshot(blogPath);
		updated.entry.frontmatter = { title: "更新後", slug: "blog" };
		controller.acceptSnapshot(updated);
		assert.partialDeepStrictEqual(states.at(-1), {
			status: "ready",
			snapshot: {
				entry: { filePath: blogPath, frontmatter: { title: "更新後" } },
			},
		});
	});

	test("検査中に対象がなくなった場合は通常の検査失敗と区別する", async () => {
		const states: InspectionRefreshState[] = [];
		const controller = new InspectionRefreshController({
			inspect: async (filePath) => {
				throw new ContentEntryUnavailableError(filePath);
			},
			onStateChange: (state) => states.push(state),
		});

		await controller.setTarget(blogPath);

		assert.deepStrictEqual(states.at(-1), {
			status: "failed",
			filePath: blogPath,
			message:
				"対象ファイルが見つかりません。削除または移動された可能性があります。",
			previous: undefined,
		});
	});
});
