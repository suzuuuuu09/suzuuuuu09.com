import { defineConfig } from "@pandacss/dev";
import { baseStyles } from "./src/styles/global/base";
import { embedStyles } from "./src/styles/global/embed";
import { emojiStyles } from "./src/styles/global/emoji";
import { markdownStyles } from "./src/styles/global/markdown";
import { zoomImageStyles } from "./src/styles/global/zoom-image";

export default defineConfig({
	// Whether to use css reset
	preflight: true,

	// Where to look for your css declarations
	include: [
		"./src/**/*.{js,jsx,ts,tsx,astro}",
		"./pages/**/*.{js,jsx,ts,tsx,astro}",
	],

	// Files to exclude
	exclude: [],

	globalCss: {
		...baseStyles,
		".markdown-content": {
			color: "sz.text.main",
			...markdownStyles,
			...embedStyles,
		},
		...emojiStyles,
		...zoomImageStyles,
	},

	// Web表示用は公開コンテンツで使用する glyph だけを収録したサブセットを使う。
	// サブセットにない文字はシステムフォントへフォールバックし、OG画像生成は元の TTF を使う。
	globalFontface: {
		"IBM Plex Sans JP Web": [
			{
				src: "url('/fonts/IBMPlexSansJP-Regular-web.woff2') format('woff2')",
				fontWeight: "400",
				fontStyle: "normal",
				fontDisplay: "swap",
			},
			{
				src: "url('/fonts/IBMPlexSansJP-Bold-web.woff2') format('woff2')",
				fontWeight: "700",
				fontStyle: "normal",
				fontDisplay: "swap",
			},
		],
		"Moralerspace Neon Web": {
			src: "url('/fonts/MoralerspaceNeon-Regular-web.woff2') format('woff2')",
			fontWeight: "400",
			fontStyle: "normal",
			fontDisplay: "swap",
		},
	},
	globalVars: {
		"--ibm-plex-sans-jp":
			'"IBM Plex Sans JP Web", -apple-system, system-ui, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif',
		"--moralerspace-neon":
			'"Moralerspace Neon Web", ui-monospace, "SFMono-Regular", Consolas, monospace',
	},

	conditions: {
		sm: "@media (max-width: 640px)",
		md: "@media (max-width: 768px) and (min-width: 641px)",
		lg: "@media (min-width: 769px)",
		dark: "[data-theme='dark'] &",
		light: "[data-theme='light'] &",
	},

	// Useful for theme customization
	theme: {
		extend: {
			tokens: {
				colors: {
					"s-primary": { value: "#3951E2" },
					// 暗色テーマの通常リンクで AA 4.5:1 以上を確保する。
					"s-primary-dark": { value: "#617afc" },
					"s-secondary": { value: "#6bbaa3" },
					"s-secondary-dark": { value: "#7ecbb3" },
					"s-bg": { value: "#faf8ff" },
					"s-bg-dark": { value: "#1a1625" },
					"s-bg-on": { value: "#F0F0F0" },
					"s-bg-on-dark": { value: "#2a2433" },
					"s-border": { value: "#D1D5DC" },
					"s-border-dark": { value: "#3d3a4a" },
					"s-text-main": { value: "#474554" },
					"s-text-main-dark": { value: "#e8e6f0" },
					"s-text-sub": { value: "#6b6878" },
					"s-text-sub-dark": { value: "#a19daf" },
					// Callout colors
					"callout-blue": { value: "#3951e2" },
					"callout-cyan": { value: "#0096d4" },
					"callout-green": { value: "#00a87a" },
					"callout-orange": { value: "#ff8365" },
					"callout-red": { value: "#ff4991" },
					"callout-purple": { value: "#d13ac2" },
					"callout-gray": { value: "#aca9bb" },
				},
			},
			semanticTokens: {
				colors: {
					"sz.primary": {
						value: {
							base: "{colors.s-primary}",
							_dark: "{colors.s-primary-dark}",
						},
					},
					"sz.secondary": {
						value: {
							base: "{colors.s-secondary}",
							_dark: "{colors.s-secondary-dark}",
						},
					},
					"sz.gradient": {
						25: {
							value: {
								base: "color-mix(in oklch, {colors.s-primary} 25%, {colors.s-secondary} 75%)",
								_dark:
									"color-mix(in oklch, {colors.s-primary-dark} 25%, {colors.s-secondary-dark} 75%)",
							},
						},
						50: {
							value: {
								base: "color-mix(in oklch, {colors.s-primary} 50%, {colors.s-secondary} 50%)",
								_dark:
									"color-mix(in oklch, {colors.s-primary-dark} 50%, {colors.s-secondary-dark} 50%)",
							},
						},
						75: {
							value: {
								base: "color-mix(in oklch, {colors.s-primary} 75%, {colors.s-secondary} 25%)",
								_dark:
									"color-mix(in oklch, {colors.s-primary-dark} 75%, {colors.s-secondary-dark} 25%)",
							},
						},
						100: {
							value: {
								base: "{colors.s-primary}",
								_dark: "{colors.s-primary-dark}",
							},
						},
					},
					"sz.bg": {
						value: {
							base: "{colors.s-bg}",
							_dark: "{colors.s-bg-dark}",
						},
					},
					"sz.bg-on": {
						DEFAULT: {
							value: {
								base: "{colors.s-bg-on}",
								_dark: "{colors.s-bg-on-dark}",
							},
						},
						100: {
							value: {
								base: "#f1f1f1",
								_dark: "#2e2838",
							},
						},
						500: {
							value: {
								base: "#f4f2f5",
								_dark: "#34304a",
							},
						},
						800: {
							value: {
								base: "#f5f3f7",
								_dark: "#3a3650",
							},
						},
					},
					"sz.text.main": {
						value: {
							base: "{colors.s-text-main}",
							_dark: "{colors.s-text-main-dark}",
						},
					},
					"sz.text.sub": {
						value: {
							base: "{colors.s-text-sub}",
							_dark: "{colors.s-text-sub-dark}",
						},
					},
					"sz.icon": {
						value: {
							base: "#000000",
							_dark: "#ffffff",
						},
					},
					"sz.border": {
						value: {
							base: "{colors.s-border}",
							_dark: "{colors.s-border-dark}",
						},
					},
					"sz.purple": {
						value: {
							base: "#9b5de5",
							_dark: "#b678f6",
						},
					},
					"sz.yellow": {
						value: {
							base: "#f1d85b",
							_dark: "#f4f472",
						},
					},
				},
			},
		},
	},

	// The output directory for your css system
	outdir: "styled-system",
	jsxFramework: "react",
});
