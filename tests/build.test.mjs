import assert from "node:assert/strict";
import childProcess from "node:child_process";
import { syncBuiltinESMExports } from "node:module";

const originalExec = childProcess.execFileSync;
const originalArgv = process.argv;
const originalWorkersCI = process.env.WORKERS_CI;
const originalToken = process.env.PORTFOLIO_CONTENT_TOKEN;
process.env.PORTFOLIO_CONTENT_TOKEN = "SYNTHETIC_TOKEN_FOR_ENV_TEST";
process.env.WORKERS_CI = "0";

try {
	for (const [index, [args, expected]] of [
		[
			["--", "--force"],
			["run", "--", "astro", "build", "--force"],
		],
		[
			["--root", "directory with spaces", "--verbose"],
			[
				"run",
				"--",
				"astro",
				"build",
				"--root",
				"directory with spaces",
				"--verbose",
			],
		],
	].entries()) {
		let calls = 0;
		childProcess.execFileSync = (command, forwarded, options) => {
			assert.equal(options.env.PORTFOLIO_CONTENT_TOKEN, undefined);
			calls++;
			assert.equal(command, "dotenvx");
			assert.deepEqual(forwarded, expected);
		};
		syncBuiltinESMExports();
		process.argv = [process.execPath, "build.mjs", ...args];
		await import(`../scripts/build.mjs?case=${index}`);
		assert.equal(calls, 1);
	}
} finally {
	if (originalToken === undefined) delete process.env.PORTFOLIO_CONTENT_TOKEN;
	else process.env.PORTFOLIO_CONTENT_TOKEN = originalToken;
	childProcess.execFileSync = originalExec;
	syncBuiltinESMExports();
	process.argv = originalArgv;
	if (originalWorkersCI === undefined) delete process.env.WORKERS_CI;
	else process.env.WORKERS_CI = originalWorkersCI;
}
