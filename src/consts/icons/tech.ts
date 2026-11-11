import type { IconCard } from "@/types";

const LANG_ICONS: Record<string, IconCard> = {
	c: { icon: "material-icon-theme:c", name: "C" },
	cpp: { icon: "material-icon-theme:cpp", name: "C++" },
	csharp: { icon: "devicon:csharp", name: "C#" },
	css: { icon: "material-icon-theme:css", name: "CSS" },
	html: { icon: "material-icon-theme:html", name: "HTML" },
	javascript: { icon: "material-icon-theme:javascript", name: "JavaScript" },
	lua: { icon: "material-icon-theme:lua", name: "Lua" },
	python: { icon: "material-icon-theme:python", name: "Python" },
	typescript: { icon: "material-icon-theme:typescript", name: "TypeScript" },
};

const DB_ORM_ICONS: Record<string, IconCard> = {
	drizzle: { icon: "simple-icons:drizzle", name: "Drizzle", color: "#0EA5E9" },
	zod: { icon: "simple-icons:zod", name: "Zod", color: "#4087FF" },
};

const GAME_ENGINE_ICONS: Record<string, IconCard> = {
	unity: { icon: "material-icon-theme:unity", name: "Unity" },
};

const FRONTEND_FRAMEWORK_ICONS: Record<string, IconCard> = {
	astro: { icon: "material-icon-theme:astro", name: "Astro" },
	gsap: { icon: "simple-icons:gsap", name: "GSAP", color: "#0AE448" },
	nextjs: { icon: "material-icon-theme:next", name: "Next.js" },
	nuxt: { icon: "material-icon-theme:nuxt", name: "Nuxt.js" },
	pandacss: { icon: "logos:pandacss-icon", name: "PandaCSS" },
	react: { icon: "simple-icons:react", name: "React", color: "#61DAFB" },
	svelte: { icon: "material-icon-theme:svelte", name: "Svelte" },
	tailwind: { icon: "material-icon-theme:tailwindcss", name: "Tailwind CSS" },
	unocss: { icon: "material-icon-theme:unocss", name: "UnoCSS" },
	vue: { icon: "material-icon-theme:vue", name: "Vue.js" },
	vuetify: { icon: "simple-icons:vuetify", name: "Vuetify", color: "#1867C0" },
};

const BACKEND_FRAMEWORK_ICONS: Record<string, IconCard> = {
	bun: { icon: "material-icon-theme:bun", name: "Bun" },
	django: { icon: "material-icon-theme:django", name: "Django" },
	expressjs: { icon: "simple-icons:express", name: "Express.js" },
	fastapi: { icon: "devicon:fastapi", name: "FastAPI" },
	flask: { icon: "simple-icons:flask", name: "Flask" },
	hono: { icon: "logos:hono", name: "Hono" },
	nodejs: { icon: "vscode-icons:file-type-node", name: "Node.js" },
};

export const TECH_ICONS: Record<string, IconCard> = {
	...LANG_ICONS,
	...DB_ORM_ICONS,
	...GAME_ENGINE_ICONS,
	...FRONTEND_FRAMEWORK_ICONS,
	...BACKEND_FRAMEWORK_ICONS,
	biome: { icon: "simple-icons:biome", name: "Biome", color: "#007ACC" },
	ffmpeg: { icon: "file-icons:ffmpeg", name: "FFmpeg", color: "#13802d" },
	flutter: { icon: "devicon:flutter", name: "Flutter" },
	jupyter: { icon: "material-icon-theme:jupyter", name: "Jupyter" },
	leaflet: { icon: "file-icons:leaflet", name: "Leaflet", color: "#199900" },
	mantine: { icon: "simple-icons:mantine", name: "Mantine", color: "#339AF0" },
	markdown: { icon: "material-icon-theme:markdown", name: "Markdown" },
	mediapipe: {
		icon: "simple-icons:mediapipe",
		name: "MediaPipe",
		color: "#0497A7",
	},
	nix: { icon: "material-icon-theme:nix", name: "Nix" },
	opencv: { icon: "devicon:opencv", name: "OpenCV" },
	pandas: { icon: "devicon:pandas", name: "Pandas" },
	selenium: { icon: "logos:selenium", name: "Selenium" },
	vite: { icon: "material-icon-theme:vite", name: "Vite" },
	archlinux: {
		icon: "simple-icons:archlinux",
		name: "Arch Linux",
		color: "#1793D1",
	},
};
