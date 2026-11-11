import type { NavigationLink } from "@/types";

function normalizePath(pathname: string): string {
	const normalized = pathname.replace(/\/+$/, "");
	return normalized || "/";
}

export function getCurrentSection(
	pathname: string,
	links: readonly NavigationLink[],
): string | undefined {
	const currentPath = normalizePath(pathname);

	return links
		.map((link) => ({
			href: link.href,
			path: normalizePath(link.sectionPath ?? link.href),
		}))
		.filter(
			({ path }) =>
				path !== "/" &&
				(currentPath === path || currentPath.startsWith(`${path}/`)),
		)
		.sort((a, b) => b.path.length - a.path.length)[0]?.href;
}
