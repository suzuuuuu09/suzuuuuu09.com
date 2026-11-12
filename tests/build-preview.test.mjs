import assert from "node:assert/strict";
import childProcess from "node:child_process";
import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import test from "node:test";

test("preview builds reject private inputs before installing dependencies", async () => {
	const originalExec = childProcess.execFileSync;
	const originalExists = fs.existsSync;
	const originalEnvironment = process.env;
	try {
		for (const [index, scenario] of [
			{ environment: { PORTFOLIO_CONTENT_TOKEN: "synthetic" } },
			{ environment: { DOTENV_PRIVATE_KEY: "synthetic" } },
			{ environment: { DOTENV_PRIVATE_KEY_PRODUCTION: "synthetic" } },
			{ file: "/.env.keys" },
			{ file: "/src/content" },
			{},
		].entries()) {
			process.env = scenario.environment ?? {};
			const calls = [];
			fs.existsSync = (file) =>
				Boolean(scenario.file && String(file).endsWith(scenario.file));
			childProcess.execFileSync = (command, args) =>
				calls.push([command, args]);
			syncBuiltinESMExports();
			const build = import(`../scripts/build-preview.mjs?scenario=${index}`);
			if (scenario.environment || scenario.file) {
				await assert.rejects(build, (error) => {
					const input =
						scenario.file?.slice(1) ?? Object.keys(scenario.environment)[0];
					assert.ok(error.message.includes(input));
					assert.ok(!error.message.includes("synthetic"));
					return true;
				});
				assert.deepEqual(calls, []);
			} else {
				await build;
				assert.deepEqual(calls, [
					["pnpm", ["install", "--frozen-lockfile"]],
					["pnpm", ["run", "build:check"]],
				]);
			}
		}
	} finally {
		process.env = originalEnvironment;
		childProcess.execFileSync = originalExec;
		fs.existsSync = originalExists;
		syncBuiltinESMExports();
	}
});
