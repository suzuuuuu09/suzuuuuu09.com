import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
	cpSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkBuildPrivacy } from "./check-build-privacy.mjs";

const projectDirectory = join(dirname(fileURLToPath(import.meta.url)), "..");
const contentDirectory = join(projectDirectory, "src/content");
const fixtureDirectory = join(projectDirectory, "tests/fixtures/site-content");
const arguments_ = process.argv.slice(2);
const checkBuild = arguments_[0] === "--check";
const buildArguments = arguments_.slice(checkBuild ? 1 : 0);

if (buildArguments[0] === "--") {
	buildArguments.shift();
}

if (process.env.WORKERS_CI === "1" && process.platform === "linux") {
	const directory = mkdtempSync(join(tmpdir(), "suzu-chromium-"));
	for (const path of ["lists/partial", "cache/archives/partial", "config.d"]) {
		mkdirSync(join(directory, path), { recursive: true });
	}
	process.env.APT_CONFIG = join(directory, "apt.conf");
	writeFileSync(
		process.env.APT_CONFIG,
		`Dir::State::lists "${join(directory, "lists")}";\n` +
			`Dir::Cache "${join(directory, "cache")}";\n` +
			`Dir::Etc::Parts "${join(directory, "config.d")}";\n` +
			'Dir::Etc::main "/dev/null";\n',
	);
	execFileSync("apt-get", ["update"], { stdio: "inherit" });
	const check = spawnSync(
		"pnpm",
		["exec", "playwright", "install-deps", "chromium", "--dry-run"],
		{ encoding: "utf8" },
	);
	assert(!check.error, check.error?.message);
	const packages = [
		...check.stdout.matchAll(/^  ([a-z0-9][a-z0-9+.:_-]*)$/gm),
	].map((match) => match[1]);
	assert(
		check.status === 0 || (check.status === 1 && packages.length > 0),
		check.stderr || check.stdout || "Could not check Chromium dependencies",
	);
	if (packages.length > 0) {
		const root = join(directory, "root");
		execFileSync("apt-get", ["download", ...packages], {
			cwd: directory,
			stdio: "inherit",
		});
		for (const file of readdirSync(directory).filter((name) =>
			name.endsWith(".deb"),
		)) {
			execFileSync("dpkg-deb", ["--extract", join(directory, file), root]);
		}
		const architecture = process.arch === "arm64" ? "aarch64" : "x86_64";
		process.env.LD_LIBRARY_PATH = [
			join(root, "usr/lib", `${architecture}-linux-gnu`),
			join(root, "usr/lib"),
			join(root, "lib", `${architecture}-linux-gnu`),
			process.env.LD_LIBRARY_PATH,
		]
			.filter(Boolean)
			.join(":");
	}
}

if (process.env.PREVIEW_DRAFTS === "true")
	throw new Error("PREVIEW_DRAFTS=true is forbidden in production builds");
const cacheDirectory = mkdtempSync(join(tmpdir(), "portfolio-build-cache-"));
const buildEnvironment = {
	...process.env,
	SITE_BUILD_CACHE: cacheDirectory,
	SITE_PRODUCTION_BUILD: "1",
};
delete buildEnvironment.PORTFOLIO_CONTENT_TOKEN;
const createdFixtures = checkBuild && !existsSync(contentDirectory);

try {
	if (createdFixtures) {
		cpSync(fixtureDirectory, contentDirectory, { recursive: true });
		console.info("Building with synthetic content fixtures.");
	}

	execFileSync("dotenvx", ["run", "--", "astro", "build", ...buildArguments], {
		cwd: projectDirectory,
		stdio: "inherit",
		env: buildEnvironment,
	});
	if (createdFixtures) {
		checkBuildPrivacy(join(projectDirectory, "dist"));
		checkBuildPrivacy(cacheDirectory);
	}
} finally {
	rmSync(cacheDirectory, { force: true, recursive: true });
	if (createdFixtures) {
		rmSync(contentDirectory, { force: true, recursive: true });
	}
}
