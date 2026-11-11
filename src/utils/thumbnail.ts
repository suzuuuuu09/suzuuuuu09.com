import { sva } from "styled-system/css";

const thumbnailStyles = sva({
	slots: ["image", "wrapper"],
	variants: {
		type: {
			card: {
				wrapper: {
					position: "relative",
					w: "full",
					maxH: "60",
					h: { base: "240", _sm: "200" },
					overflow: "hidden",
				},
				image: {
					w: "full",
					h: "full",
					objectFit: "cover",
					objectPosition: "center",
					transition: "transform 0.5s",
					_groupHover: { transform: "scale(1.05)" },
				},
			},
			info: {
				wrapper: {
					w: "full",
					display: "flex",
					justifyContent: "center",
				},
				image: {
					w: "auto",
					maxW: "full",
					h: "auto",
					maxH: "500px",
					rounded: "xl",
					objectPosition: "center",
				},
			},
		},
	},
});

export function getThumbnailStyles(type: "card" | "info") {
	return thumbnailStyles({ type });
}
