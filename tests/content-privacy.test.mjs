import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { checkBuildPrivacy } from "../scripts/check-build-privacy.mjs";
import { contentPatterns } from "../src/lib/published-content.mjs";

test("production excludes drafts before schema validation; development includes them", () => {
	const root = mkdtempSync(join(tmpdir(), "publication-test-"));
	try {
		writeFileSync(
			join(root, "published.md"),
			"---\nisPublish: true\n---\nPublished",
		);
		writeFileSync(
			join(root, "draft.md"),
			"---\nisPublish: false\n---\nDraft without required schema fields",
		);
		writeFileSync(join(root, "missing.md"), "No publication flag");
		writeFileSync(
			join(root, "string.md"),
			'---\nisPublish: "true"\n---\nNot a boolean',
		);
		assert.deepEqual(contentPatterns(root), ["published.md"]);
		assert.equal(contentPatterns(root, true), "**/*.md");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("privacy check detects private data in nested Worker/cache files", () => {
	const root = mkdtempSync(join(tmpdir(), "artifact-test-"));
	try {
		mkdirSync(join(root, "server"));
		writeFileSync(join(root, "server", "chunk.js"), "Published source");
		checkBuildPrivacy(root);
		writeFileSync(
			join(root, "server", "chunk.js"),
			"PRIVATE_DRAFT_SENTINEL_8d729c",
		);
		assert.throws(() => checkBuildPrivacy(root), /Private fixture leaked/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("production build refuses a draft override before running Astro", () => {
	const result = spawnSync(process.execPath, ["scripts/build.mjs"], {
		env: { ...process.env, PREVIEW_DRAFTS: "true", WORKERS_CI: "0" },
		encoding: "utf8",
	});
	assert.notEqual(result.status, 0);
	assert.match(result.stderr, /PREVIEW_DRAFTS=true is forbidden/);
});
