import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseFrontmatter } from "@astrojs/markdown-remark";

export function contentPatterns(directory, development = false) {
	if (development) return "**/*.md";
	const published = [];
	function visit(path, prefix = "") {
		for (const entry of readdirSync(path, { withFileTypes: true })) {
			const relative = prefix + entry.name;
			if (entry.isSymbolicLink())
				throw new Error("Content symlinks are forbidden");
			if (entry.isDirectory()) visit(join(path, entry.name), relative + "/");
			else if (entry.name.endsWith(".md")) {
				const { frontmatter } = parseFrontmatter(
					readFileSync(join(path, entry.name), "utf8"),
				);
				if (frontmatter.isPublish === true)
					published.push(relative.replace(/([*?\[\]{}()!])/g, "\\$1"));
			}
		}
	}
	visit(directory);
	return published.length ? published : ["**/*.md", "!**/*.md"];
}
