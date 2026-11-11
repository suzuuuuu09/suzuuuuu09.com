import { cva } from "styled-system/css";
import { styled as s } from "styled-system/jsx";

export const expandRecipes = cva({
	base: {
		w: "full",
		h: "full",
	},
});

export const Expand = s("div", expandRecipes);
