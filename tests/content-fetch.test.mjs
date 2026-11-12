import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
	copyFileSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

test("fetch pins a requested commit, records both revisions, and refuses to replace a Vault", () => {
	const root = mkdtempSync(join(tmpdir(), "content-fetch-test-"));
	const content = join(root, "private");
	const code = join(root, "code");
	const git = (cwd, ...args) =>
		execFileSync("git", args, {
			cwd,
			encoding: "utf8",
			stdio: ["ignore", "pipe", "pipe"],
		}).trim();
	const init = (cwd) => {
		mkdirSync(cwd, { recursive: true });
		git(cwd, "init", "-b", "main");
		git(cwd, "config", "core.hooksPath", "/dev/null");
		git(cwd, "config", "commit.gpgsign", "false");
		git(cwd, "config", "user.name", "Fixture");
		git(cwd, "config", "user.email", "fixture@example.invalid");
	};
	try {
		init(content);
		writeFileSync(join(content, "profile.md"), "original");
		git(content, "add", ".");
		git(content, "commit", "-m", "fixture");
		const pinned = git(content, "rev-parse", "HEAD");
		writeFileSync(join(content, "profile.md"), "newer");
		git(content, "commit", "-am", "newer fixture");
		init(code);
		mkdirSync(join(code, "scripts"));
		copyFileSync(
			resolve("scripts/fetch-private-content.mjs"),
			join(code, "scripts/fetch-private-content.mjs"),
		);
		git(code, "add", ".");
		git(code, "commit", "-m", "code fixture");
		const token = "PRIVATE_TEST_TOKEN_8d729c";
		const env = {
			...process.env,
			PORTFOLIO_CONTENT_TOKEN: token,
			PORTFOLIO_CONTENT_SHA: pinned,
			GIT_CONFIG_COUNT: "1",
			GIT_CONFIG_KEY_0: `url.file://${content}.insteadOf`,
			GIT_CONFIG_VALUE_0: "https://github.com/suzuuuuu09/portfolio-content.git",
		};
		const result = spawnSync(
			process.execPath,
			["scripts/fetch-private-content.mjs"],
			{ cwd: code, env, encoding: "utf8" },
		);
		assert.equal(result.status, 0, result.stderr);
		assert(!`${result.stdout}${result.stderr}`.includes(token));
		assert.equal(
			readFileSync(join(code, "src/content/profile.md"), "utf8"),
			"original",
		);
		const revisions = JSON.parse(
			readFileSync(join(code, ".build-revisions.json"), "utf8"),
		);
		assert.deepEqual(revisions, {
			codeSha: git(code, "rev-parse", "HEAD"),
			contentSha: pinned,
		});
		assert(
			!readFileSync(join(code, "src/content/.git/config"), "utf8").includes(
				token,
			),
		);
		rmSync(join(code, "src/content"), { recursive: true, force: true });
		const unavailableCommit = spawnSync(
			process.execPath,
			["scripts/fetch-private-content.mjs"],
			{
				cwd: code,
				env: { ...env, PORTFOLIO_CONTENT_SHA: "a".repeat(40) },
				encoding: "utf8",
			},
		);
		assert.notEqual(unavailableCommit.status, 0);
		assert.match(
			`${unavailableCommit.stdout}${unavailableCommit.stderr}`,
			/fetching the pinned content commit: the requested content commit is unavailable/,
		);
		assert(
			!`${unavailableCommit.stdout}${unavailableCommit.stderr}`.includes(token),
		);
		const restored = spawnSync(
			process.execPath,
			["scripts/fetch-private-content.mjs"],
			{ cwd: code, env, encoding: "utf8" },
		);
		assert.equal(restored.status, 0, restored.stderr);
		const repeat = spawnSync(
			process.execPath,
			["scripts/fetch-private-content.mjs"],
			{ cwd: code, env, encoding: "utf8" },
		);
		assert.notEqual(repeat.status, 0);
		assert.equal(
			readFileSync(join(code, "src/content/profile.md"), "utf8"),
			"original",
		);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
