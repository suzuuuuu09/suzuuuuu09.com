import type { ComponentProps, ReactNode } from "react";
import { css, cva, cx } from "styled-system/css";
import { styled as s } from "styled-system/jsx";

const cardRecipes = cva({
	base: {
		gradientTo: "sz.bg-on",
		borderRadius: "2xl",
		w: "full",
		shadow: "md",
		overflow: "hidden",
		borderWidth: "1px",
		borderColor: "sz.border/40",
		backdropFilter: "blur(10px)",
		transition: "all 0.4s",
		_md: {
			maxW: "450px",
		},
		_hover: {
			shadow: "2xl",
		},
	},
	variants: {
		maxW: {
			full: {
				_md: { maxW: "full" },
			},
			"450px": {
				_md: { maxW: "450px" },
			},
		},
	},
});

const CardRoot = s("article", cardRecipes);

const draftCardStyles = css({
	borderColor: "amber.400",
	bg: "amber.50",
	_dark: {
		borderColor: "amber.500",
		bg: "amber.950/40",
	},
});

const draftStatusStyles = css({
	px: "3",
	py: "1",
	fontFamily: "mono",
	fontSize: "xs",
	fontWeight: "bold",
	letterSpacing: "0.14em",
	lineHeight: "1.5",
	textAlign: "center",
	bg: "amber.600",
	color: "white",
	_dark: {
		bg: "amber.400",
		color: "amber.950",
	},
});

type CardProps = ComponentProps<typeof CardRoot> & {
	children?: ReactNode;
	isDraft?: boolean;
};

export function Card({
	children,
	className,
	isDraft = false,
	...props
}: CardProps) {
	return (
		<CardRoot
			{...props}
			className={cx("group", className, isDraft && draftCardStyles)}
		>
			{isDraft && (
				<div className={draftStatusStyles} role="status">
					DRAFT
				</div>
			)}
			{children}
		</CardRoot>
	);
}
