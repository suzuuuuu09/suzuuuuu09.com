import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const projectDirectory = fileURLToPath(new URL("../", import.meta.url));
// PR code can bypass this guard; Cloudflare Preview settings must withhold
// PORTFOLIO_CONTENT_TOKEN and DOTENV_PRIVATE_KEY*, and set SKIP_DEPENDENCY_INSTALL=1.
const privateCredentials = Object.keys(process.env).filter(
	(name) =>
		name === "PORTFOLIO_CONTENT_TOKEN" || name.startsWith("DOTENV_PRIVATE_KEY"),
);

if (existsSync(new URL("../.env.keys", import.meta.url))) {
	privateCredentials.push(".env.keys");
}

if (privateCredentials.length > 0) {
	throw new Error(
		`Preview builds must not receive private inputs: ${privateCredentials.join(", ")}`,
	);
}

if (existsSync(new URL("../src/content", import.meta.url))) {
	throw new Error(
		"Preview builds require a clean checkout without src/content.",
	);
}

for (const args of [
	["install", "--frozen-lockfile"],
	["run", "build:check"],
]) {
	execFileSync("pnpm", args, { cwd: projectDirectory, stdio: "inherit" });
}
