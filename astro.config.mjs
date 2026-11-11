// @ts-check

import cloudflare from "@astrojs/cloudflare";
import { unified } from "@astrojs/markdown-remark";
import partytown from "@astrojs/partytown";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import remarkCallout from "@r4ai/remark-callout";
import { defineConfig } from "astro/config";
import expressiveCode from "astro-expressive-code";
import rehypeMermaid from "rehype-mermaid";
import remarkFileTree from "remark-file-tree";
import remarkMath from "remark-math";
import remarkObsidian from "./src/lib/remark/remark-obsidian";
import { unifiedCaption } from "./src/lib/satteri/caption";
import satteriEmbedLinks from "./src/lib/satteri/embed-links/unified";
import { createUnifiedExternalLinks } from "./src/lib/satteri/external-links/unified";
import satteriHeadingLinks from "./src/lib/satteri/headings/unified";
import satteriKatex from "./src/lib/satteri/katex/unified";
import satteriWikiLinks from "./src/lib/satteri/wiki-links/unified";

if (
	(process.argv.includes("build") ||
		process.env.SITE_PRODUCTION_BUILD === "1") &&
	process.env.PREVIEW_DRAFTS === "true"
) {
	throw new Error("PREVIEW_DRAFTS=true is forbidden in production builds");
}

// https://astro.build/config
export default defineConfig({
	site: "https://suzuuuuu09.com",
	cacheDir: process.env.SITE_BUILD_CACHE ?? "./node_modules/.astro",
	output: "static",
	// Static pages use Node-only rendering dependencies during development.
	adapter:
		process.argv[2] === "dev"
			? undefined
			: cloudflare({
					prerenderEnvironment: "node",
				}),

	integrations: [
		sitemap({
			i18n: {
				defaultLocale: "ja",
				locales: {
					ja: "ja-JP",
				},
			},
		}),
		react(),
		expressiveCode({
			emitExternalStylesheet: false,
			themes: ["catppuccin-latte", "catppuccin-mocha"],
			customizeTheme: (theme) => {
				// テーマのtypeに応じてnameを設定
				theme.name = theme.type;
			},
			styleOverrides: {
				codeFontFamily: "var(--moralerspace-neon)",
				uiFontFamily: "var(--ibm-plex-sans-jp)",
				codeFontSize: "0.95rem",
				uiFontSize: "1rem",
			},
			defaultProps: {
				wrap: false,
			},
		}),
		partytown({
			config: {
				forward: ["dataLayer.push"],
			},
		}),
	],

	image: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "content.suzuuuuu09.com",
				port: "",
				pathname: "/**",
			},
		],
		domains: ["content.suzuuuuu09.com"],
	},

	markdown: {
		processor: unified({
			remarkPlugins: [
				// remarkFileTree,
				remarkObsidian,
				remarkMath,
				satteriKatex,
				satteriWikiLinks,
				remarkCallout,
				satteriEmbedLinks,
				[
					remarkFileTree,
					{
						iconThemeMode: "dark",
					},
				],
			],
			rehypePlugins: [
				unifiedCaption,
				[
					rehypeMermaid,
					{
						strategy: "img-svg",
						dark: true,
						colorScheme: "light",
						prefix: "site-mermaid",
					},
				],
				satteriHeadingLinks,
				createUnifiedExternalLinks({
					target: "_blank",
					rel: ["nofollow", "noopener", "noreferrer"],
					properties: (node) => {
						const classNames = Array.isArray(node.properties.className)
							? node.properties.className
							: node.properties.className
								? [node.properties.className]
								: [];

						return { className: [...classNames, "external-link"] };
					},
				}),
			],
			remarkRehype: {
				footnoteLabelTagName: "h2",
				footnoteLabel: "脚注",
			},
		}),
	},
	vite: {
		ssr: {
			external: ["@resvg/resvg-js", "css-tree", "csso"],
		},
		optimizeDeps: {
			exclude: ["@resvg/resvg-js"],
		},
	},
});
