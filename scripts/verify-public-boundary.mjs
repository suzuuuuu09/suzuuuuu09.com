import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectDirectory = join(dirname(fileURLToPath(import.meta.url)), "..");
const trackedFiles = execFileSync("git", ["ls-files", "-z"], {
	cwd: projectDirectory,
	encoding: "utf8",
})
	.split("\0")
	.filter(Boolean);

function readStagedFile(path) {
	return execFileSync("git", ["show", `:${path}`], {
		cwd: projectDirectory,
		encoding: "utf8",
		stdio: ["ignore", "pipe", "pipe"],
	});
}

const fixtureSentinel = '{"private":"PRIVATE_OBSIDIAN_SENTINEL_8d729c"}';

function isEnvironmentPath(path) {
	const baseName = path.split("/").pop();
	return baseName === ".env" || baseName.startsWith(".env");
}

function isAllowedEnvironmentPath(path) {
	return path === ".env";
}

function unquoteValue(rawValue) {
	const match = /^(?:"([^"\\]*)"|'([^'\\]*)'|([^\s"'\\]+))$/.exec(rawValue);
	return match ? (match[1] ?? match[2] ?? match[3]) : null;
}

const privatePaths = trackedFiles.filter((path) => {
	if (isEnvironmentPath(path)) {
		return !isAllowedEnvironmentPath(path);
	}

	const contentDirectory = path.startsWith("src/content/");
	const obsidianDirectory =
		path.split("/").includes(".obsidian") &&
		!(
			path === "tests/fixtures/site-content/.obsidian/workspace.json" &&
			readStagedFile(path).trim() === fixtureSentinel
		);

	return contentDirectory || obsidianDirectory;
});

assert.equal(
	privatePaths.length,
	0,
	"Public source must not track environment files, private content, or Obsidian settings.",
);

assert.ok(
	trackedFiles.includes(".env"),
	"Root .env must be tracked in the repository.",
);

const environmentContent = readStagedFile(".env");
const seenKeys = new Set();
let publicKeyCount = 0;

for (const line of environmentContent.split(/\r?\n/)) {
	const trimmed = line.trim();
	if (trimmed === "" || trimmed.startsWith("#")) {
		continue;
	}

	const assignment = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(trimmed);
	if (assignment === null) {
		assert.fail("Root .env contains malformed syntax.");
	}

	const [, key, rawValue] = assignment;
	if (key.startsWith("DOTENV_PRIVATE_KEY")) {
		assert.fail("Root .env must not contain private key assignments.");
	}

	if (seenKeys.has(key)) {
		assert.fail("Root .env must not contain duplicate assignments.");
	}
	seenKeys.add(key);

	const value = unquoteValue(rawValue);
	if (value === null) {
		assert.fail("Root .env contains malformed syntax.");
	}

	if (key === "DOTENV_PUBLIC_KEY") {
		publicKeyCount += 1;
		if (!/^0[23][0-9a-fA-F]{64}$/.test(value)) {
			assert.fail(
				"Root .env must contain a valid compressed secp256k1 public key.",
			);
		}
		continue;
	}

	const payload = value.slice("encrypted:".length);
	const decoded = Buffer.from(payload, "base64");
	if (
		!value.startsWith("encrypted:") ||
		decoded.toString("base64") !== payload ||
		decoded.length < 98 ||
		decoded[0] !== 4
	) {
		assert.fail("Root .env must contain only dotenvx encrypted values.");
	}
}

assert.equal(
	publicKeyCount,
	1,
	"Root .env must contain exactly one DOTENV_PUBLIC_KEY.",
);
