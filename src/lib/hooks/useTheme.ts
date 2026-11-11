import { useEffect, useState } from "react";
import { getCurrentTheme, type Theme, toTheme } from "@/lib/theme";

export type { Theme } from "@/lib/theme";

export function useTheme(): Theme {
	const [theme, setTheme] = useState<Theme>("light");

	useEffect(() => {
		setTheme(getCurrentTheme());

		const handleThemeChange = (event: Event) => {
			const customEvent = event as CustomEvent<{ theme: string }>;
			setTheme(toTheme(customEvent.detail?.theme));
		};

		globalThis.addEventListener("themeChange", handleThemeChange);

		return () => {
			globalThis.removeEventListener("themeChange", handleThemeChange);
		};
	}, []);

	return theme;
}
