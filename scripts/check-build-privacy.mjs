import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
export function checkBuildPrivacy(directory) {
	for (const entry of readdirSync(directory, { withFileTypes: true })) {
		const path = join(directory, entry.name);
		assert(
			entry.name !== ".obsidian",
			"Obsidian settings leaked into build output",
		);
		if (entry.isDirectory()) checkBuildPrivacy(path);
		else if (entry.isFile()) {
			const data = readFileSync(path);
			for (const marker of [
				"PRIVATE_DRAFT_SENTINEL_8d729c",
				"private-draft-sentinel-8d729c",
				"PRIVATE_OBSIDIAN_SENTINEL_8d729c",
			]) {
				assert(
					!data.includes(Buffer.from(marker)),
					"Private fixture leaked into build output or cache",
				);
			}
		}
	}
}
