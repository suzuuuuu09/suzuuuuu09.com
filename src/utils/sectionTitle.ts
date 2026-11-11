import { sva } from "styled-system/css";

const underlineOffset = "2px";
const underlineHeight = "12px";

const sectionTitleStyles = sva({
	slots: ["wrapper", "title"],
	base: {
		wrapper: {
			textAlign: "center",
			mb: "4",
		},
		title: {
			color: "sz.text.main",
			fontSize: "3xl",
			fontWeight: "bold",
			borderBottomWidth: "4px",
			borderBottomStyle: "solid",
			borderBottomColor: "transparent",
			position: "relative",
			display: "inline-block",
			textDecoration: "none",
			_after: {
				content: "''",
				position: "absolute",
				bottom: underlineOffset,
				left: "-10%",
				width: "120%",
				height: underlineHeight,
				backgroundColor: "sz.primary",
				maskImage: "url('/imgs/heading-underline.svg')",
				maskPosition: "center",
				maskRepeat: "no-repeat",
				maskSize: "100% 100%",
				maskMode: "alpha",
				WebkitMaskImage: "url('/imgs/heading-underline.svg')",
				WebkitMaskPosition: "center",
				WebkitMaskRepeat: "no-repeat",
				WebkitMaskSize: "100% 100%",
			},
		},
	},
});

export function getSectionTitleStyles() {
	return sectionTitleStyles();
}
