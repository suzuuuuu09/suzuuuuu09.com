import assert from "node:assert/strict";
import test from "node:test";
import { toggleTheme } from "../src/lib/theme";

test("theme reveal uses scalable coordinates and covers every viewport corner", async () => {
	const names = [
		"document",
		"window",
		"localStorage",
		"dispatchEvent",
	] as const;
	const originals = names.map((name) =>
		Object.getOwnPropertyDescriptor(globalThis, name),
	);
	let clips: string[] = [];
	const root = {
		dataset: { theme: "light" },
		setAttribute: (_name: string, theme: string) => {
			root.dataset.theme = theme;
		},
		animate: (frames: { clipPath: string[] }) => {
			clips = frames.clipPath;
		},
	};
	try {
		Object.defineProperty(globalThis, "dispatchEvent", {
			configurable: true,
			value: () => true,
		});
		Object.defineProperty(globalThis, "document", {
			configurable: true,
			value: {
				documentElement: root,
				startViewTransition: (update: () => void) => {
					update();
					return { ready: Promise.resolve() };
				},
			},
		});
		Object.defineProperty(globalThis, "localStorage", {
			configurable: true,
			value: { setItem() {} },
		});
		for (const [width, height, x, y] of [
			[1440, 900, 1140, 49],
			[390, 844, 288, 48],
		]) {
			Object.defineProperty(globalThis, "window", {
				configurable: true,
				value: { innerWidth: width, innerHeight: height },
			});
			await toggleTheme({
				getBoundingClientRect: () => ({
					left: x - 19,
					top: y - 19,
					width: 38,
					height: 38,
				}),
			} as HTMLElement);
			for (const clip of clips) {
				const match = /^circle\(([\d.]+)% at ([\d.]+)% ([\d.]+)%\)$/.exec(clip);
				assert.ok(
					match,
					"pixel coordinates reintroduce the Retina origin offset",
				);
				const [, radius, centerX, centerY] = match.map(Number);
				for (const scale of [1, 2]) {
					assert.ok(
						Math.abs((centerX / 100) * width * scale - x * scale) < 1e-8,
					);
					assert.ok(
						Math.abs((centerY / 100) * height * scale - y * scale) < 1e-8,
					);
				}
				if (radius > 0) {
					const pixels =
						((radius / 100) * Math.hypot(width, height)) / Math.SQRT2;
					for (const cornerX of [0, width])
						for (const cornerY of [0, height]) {
							assert.ok(pixels + 1e-8 >= Math.hypot(cornerX - x, cornerY - y));
						}
				}
			}
		}
	} finally {
		names.forEach((name, index) => {
			const descriptor = originals[index];
			if (descriptor) Object.defineProperty(globalThis, name, descriptor);
			else Reflect.deleteProperty(globalThis, name);
		});
	}
});
