import { execFileSync } from "node:child_process";

const environment = { ...process.env };
delete environment.PORTFOLIO_CONTENT_TOKEN;
execFileSync("pnpm", ["install", "--frozen-lockfile"], {
	env: environment,
	stdio: "inherit",
});
execFileSync(process.execPath, ["scripts/fetch-private-content.mjs"], {
	env: process.env,
	stdio: "inherit",
});
execFileSync("pnpm", ["run", "build"], { env: environment, stdio: "inherit" });
