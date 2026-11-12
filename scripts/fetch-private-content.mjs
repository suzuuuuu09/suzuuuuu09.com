import { execFileSync } from "node:child_process";
import {
	chmodSync,
	cpSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectDirectory = join(dirname(fileURLToPath(import.meta.url)), "..");
const contentDirectory = join(projectDirectory, "src/content");
const contentRepository = "https://github.com/suzuuuuu09/portfolio-content.git";
const contentBranch = "main";
const requestedSha = process.env.PORTFOLIO_CONTENT_SHA;
if (requestedSha && !/^[a-f0-9]{40}$/.test(requestedSha))
	throw new Error("PORTFOLIO_CONTENT_SHA must be a full commit SHA");
const token = process.env.PORTFOLIO_CONTENT_TOKEN;

const safeFailureReason = (error) => {
	const stderr = String(error?.stderr ?? "").toLowerCase();
	if (
		/authentication failed|bad credentials|invalid username or password|returned error: 401/.test(
			stderr,
		)
	)
		return "GitHub rejected the token";
	if (
		/repository not found|access denied|write access .*not granted|returned error: 403|returned error: 404/.test(
			stderr,
		)
	)
		return "the token cannot access the private repository";
	if (/not our ref|unadvertised object|couldn't find remote ref/.test(stderr))
		return "the requested content commit is unavailable";
	if (/could not read username|terminal prompts disabled/.test(stderr))
		return "Git did not receive credentials";
	return "the Git operation failed; details withheld";
};

if (existsSync(contentDirectory)) {
	throw new Error(
		"Refusing to replace src/content. Run this only in a clean code checkout.",
	);
}

if (!token) {
	throw new Error(
		"PORTFOLIO_CONTENT_TOKEN is required to fetch private content.",
	);
}

const temporaryDirectory = mkdtempSync(join(tmpdir(), "portfolio-content-"));
const askPassPath = join(temporaryDirectory, "askpass");
const checkoutPath = join(temporaryDirectory, "content");

try {
	let stage = "resolving the content commit";
	writeFileSync(
		askPassPath,
		'#!/bin/sh\ncase "$1" in\n*Username*) printf \'%s\\n\' "x-access-token" ;;\n*) printf \'%s\\n\' "$PORTFOLIO_CONTENT_TOKEN" ;;\nesac\n',
	);
	chmodSync(askPassPath, 0o700);

	const gitEnvironment = {
		...process.env,
		GIT_ASKPASS: askPassPath,
		GIT_TERMINAL_PROMPT: "0",
	};
	const localEnvironment = { ...process.env };
	delete localEnvironment.PORTFOLIO_CONTENT_TOKEN;
	const git = (args, authenticated = false) =>
		execFileSync("git", ["-c", "credential.helper=", ...args], {
			env: authenticated ? gitEnvironment : localEnvironment,
			encoding: "utf8",
			stdio: ["ignore", "pipe", "pipe"],
		});
	try {
		const sha =
			requestedSha ??
			git(
				["ls-remote", contentRepository, "refs/heads/" + contentBranch],
				true,
			).split(/\s/)[0];
		if (!/^[a-f0-9]{40}$/.test(sha))
			throw new Error("Could not resolve content commit");
		const codeSha = git(["-C", projectDirectory, "rev-parse", "HEAD"]).trim();
		writeFileSync(
			join(projectDirectory, ".build-revisions.json"),
			JSON.stringify({ codeSha, contentSha: sha }, null, 2) + "\n",
		);
		console.info(JSON.stringify({ codeSha, contentSha: sha }));
		stage = "initializing the temporary checkout";
		git(["init", checkoutPath]);
		stage = "configuring the private content remote";
		git(["-C", checkoutPath, "remote", "add", "origin", contentRepository]);
		stage = "fetching the pinned content commit";
		git(["-C", checkoutPath, "fetch", "--depth", "1", "origin", sha], true);
		stage = "checking out the pinned content commit";
		git(["-C", checkoutPath, "checkout", "--detach", sha]);
		stage = "verifying the checked out content commit";
		const actual = git(["-C", checkoutPath, "rev-parse", "HEAD"]).trim();
		if (actual !== sha) throw new Error("Content commit mismatch");
	} catch (error) {
		throw new Error(
			`Private content fetch failed while ${stage}: ${safeFailureReason(error)}. Authentication output withheld.`,
		);
	}

	const treeEntries = execFileSync(
		"git",
		["-C", checkoutPath, "ls-tree", "-r", "-z", "HEAD"],
		{ encoding: "utf8", env: localEnvironment },
	)
		.split("\0")
		.filter(
			(entry) => entry.startsWith("120000 ") || entry.startsWith("160000 "),
		);

	if (treeEntries.length > 0) {
		throw new Error(
			"The private content repository must not contain symbolic links or submodules.",
		);
	}

	mkdirSync(dirname(contentDirectory), { recursive: true });
	cpSync(checkoutPath, contentDirectory, { recursive: true });
} finally {
	rmSync(temporaryDirectory, { force: true, recursive: true });
}
