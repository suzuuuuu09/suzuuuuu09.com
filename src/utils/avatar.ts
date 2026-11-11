import { cva } from "styled-system/css";

export function getAvatarClassName(
	size: number,
	border: boolean,
	square: boolean,
	objectFit: "cover" | "contain" | "fill" | "none" | "scale-down",
) {
	const avatarStyles = cva({
		base: {
			display: "block",
			maxWidth: "none",
			minWidth: `${size}px`,
			minHeight: `${size}px`,
			width: `${size}px`,
			height: `${size}px`,
		},
		variants: {
			border: {
				false: {},
				true: {
					borderWidth: "2px",
					borderStyle: "solid",
					borderColor: "sz.border",
					borderRadius: "lg",
					padding: "2",
					boxSizing: "border-box",
				},
			},
			square: {
				false: {},
				true: {
					aspectRatio: "1 / 1",
					bg: "sz.bg",
				},
			},
			fit: {
				cover: { objectFit: "cover" },
				contain: { objectFit: "contain" },
				fill: { objectFit: "fill" },
				none: { objectFit: "none" },
				"scale-down": { objectFit: "scale-down" },
			},
		},
		defaultVariants: {
			fit: "contain",
		},
	});

	return avatarStyles({ border, square, fit: objectFit });
}
