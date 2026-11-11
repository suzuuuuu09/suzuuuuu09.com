import { carouselAnatomy } from "@ark-ui/react/carousel";
import { sva } from "styled-system/css";

const triggerStyles = {
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	w: "6",
	h: "6",
	minW: "6",
	minH: "6",
	p: "0",
	borderRadius: "full",
	borderWidth: "1px",
	borderColor: "sz.border",
	bg: "white",
	color: "black",
	boxShadow: "md",
	cursor: "pointer",
	opacity: 0,
	pointerEvents: "auto",
	transition: "opacity 100ms ease",
	_hover: {
		opacity: 1,
	},
	_focusVisible: {
		opacity: 1,
		outline: "2px solid",
		outlineColor: "sz.primary",
		outlineOffset: "2px",
	},
	_active: {
		transform: "translateY(1px)",
	},
};

export const carouselStyles = sva({
	slots: carouselAnatomy.keys(),
	base: {
		root: {
			position: "relative",
			h: "500px",
			overflow: "hidden",
			borderRadius: "xl",
			"&:hover [data-part='prev-trigger']": {
				opacity: 1,
			},
			"&:hover [data-part='next-trigger']": {
				opacity: 1,
			},
			"&:focus-within [data-part='prev-trigger']": {
				opacity: 1,
			},
			"&:focus-within [data-part='next-trigger']": {
				opacity: 1,
			},
			"@media (hover: none)": {
				"& [data-part='prev-trigger']": {
					opacity: 1,
				},
				"& [data-part='next-trigger']": {
					opacity: 1,
				},
			},
		},
		itemGroup: {
			h: "full",
			"&::-webkit-scrollbar": {
				display: "none",
			},
		},
		item: {
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			h: "full",
			w: "full",
		},
		control: {
			position: "absolute",
			top: "50%",
			right: "0",
			left: "0",
			zIndex: 1,
			display: "flex",
			alignItems: "center",
			justifyContent: "space-between",
			px: "4",
			pointerEvents: "none",
			transform: "translateY(-50%)",
		},
		prevTrigger: triggerStyles,
		nextTrigger: triggerStyles,
		indicatorGroup: {
			position: "absolute",
			right: "0",
			bottom: "3",
			left: "0",
			zIndex: 1,
			display: "flex",
			justifyContent: "center",
			gap: "2",
			pointerEvents: "none",
		},
		indicator: {
			display: "grid",
			placeItems: "center",
			w: "8",
			h: "8",
			p: "0",
			border: "none",
			borderRadius: "full",
			bg: "transparent",
			cursor: "pointer",
			pointerEvents: "auto",
			_before: {
				content: '""',
				w: "3",
				h: "3",
				borderRadius: "full",
				bg: "white",
				boxShadow: "sm",
				opacity: 0.1,
				transition: "opacity 0.3s ease",
			},
			"&[data-current]::before": {
				opacity: 1,
			},
			"&:hover::before": {
				opacity: 1,
			},
			_focusVisible: {
				outline: "2px solid",
				outlineColor: "sz.primary",
				outlineOffset: "2px",
			},
		},
	},
});
