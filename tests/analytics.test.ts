import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("production rejects missing IDs and previews suppress analytics", () => {
	for (const disabled of ["1", "0"]) {
		for (const id of ["", "   ", "encrypted:synthetic", " G-SYNTHETIC "]) {
			const environment: NodeJS.ProcessEnv = {
				...process.env,
				SITE_PRODUCTION_BUILD: "1",
				DISABLE_GA_TRACKING: disabled,
				PUBLIC_GA_TRACKING_ID: id,
			};
			if (!id) delete environment.PUBLIC_GA_TRACKING_ID;

			const result = spawnSync(
				process.execPath,
				[
					"--import",
					"tsx",
					"--input-type=module",
					"-e",
					'import { GA_TRACKING_ID } from "./src/consts/base.ts"; process.stdout.write(GA_TRACKING_ID);',
				],
				{
					cwd: new URL("../", import.meta.url),
					env: environment,
					encoding: "utf8",
				},
			);
			assert.ifError(result.error);

			if (disabled === "0" && !id.includes("G-SYNTHETIC")) {
				assert.notEqual(result.status, 0);
				assert.match(
					result.stderr,
					/Production builds require a decrypted PUBLIC_GA_TRACKING_ID/,
				);
				assert.ok(!result.stderr.includes("encrypted:synthetic"));
			} else {
				assert.equal(result.status, 0, result.stderr);
				assert.equal(
					result.stdout,
					disabled === "0" && id.trim() === "G-SYNTHETIC" ? "G-SYNTHETIC" : "",
				);
			}
		}
	}
});
