import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const projectDirectory = fileURLToPath(new URL("../", import.meta.url));
const privateCredential = Object.keys(process.env).some(
	(name) =>
		name === "PORTFOLIO_CONTENT_TOKEN" || name.startsWith("DOTENV_PRIVATE_KEY"),
);

if (privateCredential || existsSync(new URL("../.env.keys", import.meta.url))) {
	throw new Error(
		"Preview builds must not receive private content credentials or dotenvx decryption keys.",
	);
}

if (existsSync(new URL("../src/content", import.meta.url))) {
	throw new Error(
		"Preview builds require a clean checkout without private content.",
	);
}

for (const args of [
	["install", "--frozen-lockfile"],
	["run", "build:check"],
]) {
	execFileSync("pnpm", args, { cwd: projectDirectory, stdio: "inherit" });
}
