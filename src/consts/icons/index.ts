import type { IconCard } from "@/types";
import { EDITOR_ICONS } from "./editors";
import { PLATFORM_ICONS } from "./platforms";
import { TECH_ICONS } from "./tech";

export const ICON_CARDS: Record<string, IconCard> = {
	...TECH_ICONS,
	...PLATFORM_ICONS,
	...EDITOR_ICONS,
};

export type IconCardKey = keyof typeof ICON_CARDS;
