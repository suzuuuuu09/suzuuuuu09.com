import assert from "node:assert/strict";
import test from "node:test";
import { diagnoseContentAccess } from "../scripts/diagnose-content-access.mjs";

test("access diagnostic reports independent HTTP statuses without credentials or response bodies", async () => {
	const token = "PRIVATE_FIXTURE_TOKEN";
	const statuses = [200, 404, 403];
	let cancelled = 0;
	const result = await diagnoseContentAccess(
		token,
		"a".repeat(40),
		async (_url, options) => {
			assert(
				options.headers.Authorization.includes(token) ||
					options.headers.Authorization.startsWith("Basic "),
			);
			assert.equal(options.redirect, "manual");
			return {
				status: statuses.shift(),
				body: {
					cancel: async () => {
						cancelled++;
					},
				},
			};
		},
	);
	assert.deepEqual(result, { repository: 200, commit: 404, git: 403 });
	assert.equal(cancelled, 3);
	assert(!JSON.stringify(result).includes(token));
});
