export interface ContactLink {
	label: string;
	url: string;
	icon: string;
	color?: string;
}

export interface NavigationLink {
	href: string;
	sectionPath?: string;
	label: string;
}

export interface IconCard {
	icon: string;
	name: string;
	color?: string;
}

export type BlogCategory = "tech" | "idea" | "work" | "private";

export interface CategoryItem {
	category: BlogCategory;
	emoji: string;
}
