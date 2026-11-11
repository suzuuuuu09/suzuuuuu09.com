import assert from "node:assert/strict";
import childProcess from "node:child_process";
import { syncBuiltinESMExports } from "node:module";
import test from "node:test";

test("production only passes content credentials to the fetch process", async () => {
	const original = childProcess.execFileSync;
	const originalToken = process.env.PORTFOLIO_CONTENT_TOKEN;
	const calls = [];
	process.env.PORTFOLIO_CONTENT_TOKEN = "SYNTHETIC_PRODUCTION_TOKEN";
	try {
		childProcess.execFileSync = (command, args, options) => {
			calls.push([command, args]);
			const fetch = command === process.execPath;
			assert.equal(
				options.env.PORTFOLIO_CONTENT_TOKEN,
				fetch ? "SYNTHETIC_PRODUCTION_TOKEN" : undefined,
			);
		};
		syncBuiltinESMExports();
		await import("../scripts/build-production.mjs");
		assert.deepEqual(calls, [
			["pnpm", ["install", "--frozen-lockfile"]],
			[process.execPath, ["scripts/fetch-private-content.mjs"]],
			["pnpm", ["run", "build"]],
		]);
	} finally {
		childProcess.execFileSync = original;
		syncBuiltinESMExports();
		if (originalToken === undefined) delete process.env.PORTFOLIO_CONTENT_TOKEN;
		else process.env.PORTFOLIO_CONTENT_TOKEN = originalToken;
	}
});
