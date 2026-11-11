export type Theme = "light" | "dark";

export function toTheme(value: string | null | undefined): Theme {
	return value === "dark" ? "dark" : "light";
}

export function getCurrentTheme(): Theme {
	return toTheme(
		document.documentElement.dataset.theme ?? localStorage.getItem("theme"),
	);
}

function applyTheme(theme: Theme): void {
	localStorage.setItem("theme", theme);
	document.documentElement.setAttribute("data-theme", theme);
	globalThis.dispatchEvent(
		new CustomEvent("themeChange", { detail: { theme } }),
	);
}

export async function toggleTheme(toggle: HTMLElement | null): Promise<Theme> {
	const nextTheme: Theme = getCurrentTheme() === "dark" ? "light" : "dark";

	if (!toggle || !document.startViewTransition) {
		applyTheme(nextTheme);
		return nextTheme;
	}

	const rect = toggle.getBoundingClientRect();
	const x = rect.left + rect.width / 2;
	const y = rect.top + rect.height / 2;
	const center = `${(x / window.innerWidth) * 100}% ${(y / window.innerHeight) * 100}%`;
	const endRadius =
		(Math.hypot(
			Math.max(x, window.innerWidth - x),
			Math.max(y, window.innerHeight - y),
		) /
			(Math.hypot(window.innerWidth, window.innerHeight) / Math.SQRT2)) *
		100;

	const transition = document.startViewTransition(() => {
		applyTheme(nextTheme);
	});

	await transition.ready;
	document.documentElement.animate(
		{
			clipPath: [
				`circle(0% at ${center})`,
				`circle(${endRadius}% at ${center})`,
			],
		},
		{
			duration: 500,
			easing: "ease-in-out",
			pseudoElement: "::view-transition-new(root)",
		},
	);

	return nextTheme;
}
