import { cva } from "styled-system/css";
import { styled as s } from "styled-system/jsx";
import { categories } from "@/consts/category";
import type { BlogCategory } from "@/types";

export interface Props {
	category?: BlogCategory;
}

const badgeRecipes = cva({
	base: {
		display: "inline-flex",
		alignItems: "center",
		gap: "1",
		px: "2.5",
		py: "1",
		borderRadius: "md",
		fontSize: "xs",
		fontWeight: "semibold",
		borderWidth: "1",
	},
	variants: {
		category: {
			tech: {
				bgColor: "sz.primary/20",
				color: "sz.primary",
				borderColor: "sz.primary/40",
			},
			idea: {
				bgColor: "sz.secondary/25",
				color: "sz.text.main",
				borderColor: "sz.secondary/50",
			},
			work: {
				bgColor: "sz.purple/20",
				color: "sz.purple",
				borderColor: "sz.purple/40",
			},
			private: {
				bgColor: "sz.yellow/25",
				color: "sz.text.main",
				borderColor: "sz.yellow/50",
			},
		},
	},
	defaultVariants: {
		category: "tech",
	},
});

export default function CategoryBadge({ category }: Props) {
	const currentCategory = categories.find((c) => c.category === category);

	return (
		<>
			{currentCategory && (
				<div className={badgeRecipes({ category: currentCategory.category })}>
					<s.span>{currentCategory.emoji}</s.span>
					<s.span textTransform="capitalize">{currentCategory.category}</s.span>
				</div>
			)}
		</>
	);
}
