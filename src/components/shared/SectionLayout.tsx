import { cva } from "styled-system/css";
import { styled as s } from "styled-system/jsx";

export const sectionLayoutRecipes = cva({
	base: {
		py: "5",
		w: "full",
	},
});

export const SectionLayout = s("section", sectionLayoutRecipes);
