import { defineGlobalStyles } from "@pandacss/dev";

export const baseStyles = defineGlobalStyles({
	html: {
		scrollBehavior: "smooth",
	},
	body: {
		color: "sz.text.main !important",
		bg: "sz.bg !important",
		fontFamily: "var(--ibm-plex-sans-jp) !important",
		fontFeatureSettings: "'plat'",
	},
	// スクロールバーのスタイル
	"::-webkit-scrollbar": {
		width: "10px",
		height: "10px",
	},
	"::-webkit-scrollbar-thumb": {
		bg: "sz.primary/30",
		"&:hover": {
			bg: "sz.primary/50",
		},
	},
});
