import { cva } from "styled-system/css";
import { styled as s } from "styled-system/jsx";

const gridStyles = cva({
	base: {
		display: "grid",
	},
	variants: {
		variant: {
			article: {
				gap: "6",
				gridTemplateColumns: {
					base: "repeat(1, minmax(0, 1fr))",
					md: "repeat(2, minmax(0, 1fr))",
				},
				_md: {
					justifyItems: "center",
					alignItems: "center",
				},
			},
			skill: {
				gridTemplateColumns: "repeat(auto-fill,minmax(100px,1fr))",
				alignItems: "start",
				justifyContent: "center",
				textAlign: "center",
				alignContent: "stretch",
				justifyItems: "center",
				mb: "8",
			},
		},
	},
});

export const Grid = s("div", gridStyles);
