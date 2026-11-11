import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const projectDirectory = join(dirname(fileURLToPath(import.meta.url)), "..");
const scriptSource = join(
	projectDirectory,
	"scripts",
	"verify-public-boundary.mjs",
);

const publicKey = `02${"11".repeat(32)}`;
const ciphertext = `encrypted:${Buffer.concat([Buffer.from([4]), Buffer.alloc(108, 1)]).toString("base64")}`;
const fixtureSentinel = '{"private":"PRIVATE_OBSIDIAN_SENTINEL_8d729c"}';

function encryptedEnvironment(extra = "") {
	return [
		"# Synthetic dotenvx fixture",
		`DOTENV_PUBLIC_KEY=${publicKey}`,
		`API_TOKEN=${ciphertext}`,
		`QUOTED_TOKEN="${ciphertext}"`,
		extra,
		"",
	].join("\n");
}

function runBoundary(files, afterStage = {}) {
	const repository = mkdtempSync(join(tmpdir(), "public-boundary-"));
	try {
		mkdirSync(join(repository, "scripts"), { recursive: true });
		cpSync(
			scriptSource,
			join(repository, "scripts", "verify-public-boundary.mjs"),
		);

		for (const [path, content] of Object.entries(files)) {
			const destination = join(repository, path);
			mkdirSync(dirname(destination), { recursive: true });
			writeFileSync(destination, content);
		}

		const init = spawnSync("git", ["init", "-q"], {
			cwd: repository,
			encoding: "utf8",
		});
		assert.equal(init.status, 0, init.stderr);

		const add = spawnSync("git", ["add", "-A", "-f"], {
			cwd: repository,
			encoding: "utf8",
		});
		assert.equal(add.status, 0, add.stderr);

		return spawnSync(process.execPath, ["scripts/verify-public-boundary.mjs"], {
			cwd: repository,
			encoding: "utf8",
		});
	} finally {
		rmSync(repository, { recursive: true, force: true });
	}
}

test("accepts encrypted root .env and the content Obsidian sentinel", () => {
	const result = runBoundary({
		".env": encryptedEnvironment(),
		"tests/fixtures/site-content/.obsidian/workspace.json": fixtureSentinel,
	});

	assert.equal(result.status, 0, result.stderr);
});

test("rejects plaintext values without exposing them", () => {
	const secret = "synthetic plaintext";
	const result = runBoundary({
		".env": encryptedEnvironment(`PLAIN_VALUE=${secret}`),
	});

	assert.notEqual(result.status, 0);
	assert.doesNotMatch(result.stderr, new RegExp(secret));
	assert.doesNotMatch(result.stdout, new RegExp(secret));
});

test("rejects duplicate assignments", () => {
	const result = runBoundary({
		".env": encryptedEnvironment(`API_TOKEN=${ciphertext}`),
	});

	assert.notEqual(result.status, 0);
});

test("rejects private key assignments regardless of value", () => {
	const secret = "synthetic private key";
	const result = runBoundary({
		".env": encryptedEnvironment(`DOTENV_PRIVATE_KEY_DEV=${secret}`),
	});

	assert.notEqual(result.status, 0);
	assert.doesNotMatch(result.stderr, new RegExp(secret));
	assert.doesNotMatch(result.stdout, new RegExp(secret));
});

test("rejects root .env.keys and nested env files", () => {
	for (const path of [
		".env.keys",
		".env.example",
		"nested/.env",
		"nested/.env.example",
		"config/.env.local",
	]) {
		const result = runBoundary({
			".env": encryptedEnvironment(),
			[path]: "ignored\n",
		});

		assert.notEqual(result.status, 0, `${path} should be rejected`);
	}
});

test("rejects src content", () => {
	const result = runBoundary({
		".env": encryptedEnvironment(),
		"src/content/private.md": "# Private\n",
	});

	assert.notEqual(result.status, 0);
});

test("rejects a real Obsidian directory", () => {
	const result = runBoundary({
		".env": encryptedEnvironment(),
		".obsidian/workspace.json": fixtureSentinel,
	});

	assert.notEqual(result.status, 0);
});

test("rejects a modified fixture Obsidian sentinel", () => {
	const result = runBoundary({
		".env": encryptedEnvironment(),
		"tests/fixtures/site-content/.obsidian/workspace.json":
			'{"private":"REAL_OBSIDIAN_DATA"}',
	});

	assert.notEqual(result.status, 0);
});

test("rejects invalid public keys and missing or duplicate keys", () => {
	for (const environment of [
		`DOTENV_PUBLIC_KEY=04${"11".repeat(32)}\nAPI_TOKEN=${ciphertext}\n`,
		`DOTENV_PUBLIC_KEY=02${"11".repeat(31)}\nAPI_TOKEN=${ciphertext}\n`,
		`DOTENV_PUBLIC_KEY=${publicKey}\nDOTENV_PUBLIC_KEY=${publicKey}\nAPI_TOKEN=${ciphertext}\n`,
		`API_TOKEN=${ciphertext}\n`,
	]) {
		const result = runBoundary({ ".env": environment });
		assert.notEqual(result.status, 0);
	}
});

test("rejects malformed encrypted payloads", () => {
	for (const value of [
		"encrypted:",
		"encrypted:abc",
		"encrypted:zz",
		"encrypted:abcz",
	]) {
		const result = runBoundary({
			".env": `DOTENV_PUBLIC_KEY=${publicKey}\nBAD_VALUE=${value}\n`,
		});

		assert.notEqual(result.status, 0, `${value} should be rejected`);
	}
});

test("rejects a repository without a root .env", () => {
	const result = runBoundary({
		".env.example": "DOTENV_PUBLIC_KEY=\nAPI_TOKEN=\n",
	});

	assert.notEqual(result.status, 0);
});

test("checks staged values even when the working copy is safe", () => {
	const result = runBoundary(
		{ ".env": encryptedEnvironment("TOKEN=plain") },
		{ ".env": encryptedEnvironment() },
	);
	assert.notEqual(result.status, 0);
	const path = "tests/fixtures/site-content/.obsidian/workspace.json";
	const fixture = runBoundary(
		{ ".env": encryptedEnvironment(), [path]: "private" },
		{ [path]: fixtureSentinel },
	);
	assert.notEqual(fixture.status, 0);
});
