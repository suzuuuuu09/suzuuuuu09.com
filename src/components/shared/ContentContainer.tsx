import { cva } from "styled-system/css";
import { styled as s } from "styled-system/jsx";

export const containerRecipes = cva({
	base: {
		display: "flex",
		flex: "1",
		position: "relative",
		zIndex: "10",
		px: "6",
		pt: "28",
		mx: "auto",
		minH: "100vh",
		flexDir: "column",
		alignItems: "center",
		w: "full",
	},
	variants: {
		maxW: {
			xl: { maxW: "xl" },
			"2xl": { maxW: "2xl" },
			"3xl": { maxW: "3xl" },
			"4xl": { maxW: "4xl" },
			"5xl": { maxW: "5xl" },
			"6xl": { maxW: "6xl" },
			"7xl": { maxW: "7xl" },
		},
	},
	defaultVariants: {
		maxW: "5xl",
	},
});

export const ContentContainer = s("main", containerRecipes);
