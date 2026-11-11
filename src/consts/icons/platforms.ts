import type { IconCard } from "@/types";

export const PLATFORM_ICONS: Record<string, IconCard> = {
	cloudflarepages: {
		icon: "simple-icons:cloudflarepages",
		name: "Cloudflare Pages",
		color: "#F38020",
	},
	cloudflareworkers: {
		icon: "simple-icons:cloudflare",
		name: "Cloudflare Workers",
		color: "#F38020",
	},
	git: { icon: "material-icon-theme:git", name: "Git" },
	github: { icon: "simple-icons:github", name: "GitHub" },
	githubactions: {
		icon: "simple-icons:githubactions",
		name: "GitHub Actions",
		color: "#2088FF",
	},
	obsidian: {
		icon: "simple-icons:obsidian",
		name: "Obsidian",
		color: "#7C3AED",
	},
	vercel: { icon: "material-icon-theme:vercel", name: "Vercel" },
	zenn: { icon: "material-icon-theme:zenn", name: "Zenn" },
	qiita: { icon: "material-icon-theme:qiita", name: "Qiita" },
};
