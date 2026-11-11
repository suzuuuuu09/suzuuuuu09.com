type TwitterTheme = "light" | "dark";

interface TwitterWidgetWindow extends Window {
	twttr?: {
		widgets?: {
			createTweet: (
				tweetId: string,
				container: HTMLElement,
				options?: {
					width?: number | string;
					theme?: TwitterTheme;
					dnt?: boolean;
					conversation?: "none" | "all";
					align?: "left" | "center" | "right";
				},
			) => Promise<unknown>;
		};
	};
}

const TWITTER_WIDGETS_SRC = "https://platform.twitter.com/widgets.js";

let widgetsPromise: Promise<void> | null = null;
let twitterRenderCounter = 0;

function getTheme(): TwitterTheme {
	return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function createStagingContainer(): HTMLDivElement {
	const staging = document.createElement("div");
	staging.dataset.twitterEmbedStaging = "true";
	staging.style.position = "fixed";
	staging.style.left = "-99999px";
	staging.style.top = "0";
	staging.style.visibility = "hidden";
	staging.style.pointerEvents = "none";
	staging.style.width = "550px";
	staging.style.maxWidth = "550px";
	document.body.append(staging);
	return staging;
}

function getTwitterWrapper(container: HTMLElement): HTMLElement | null {
	return container.closest<HTMLElement>(".twitter-embed-container");
}

async function ensureWidgets(): Promise<void> {
	const twitterWindow = window as TwitterWidgetWindow;

	if (twitterWindow.twttr?.widgets?.createTweet) return;

	if (widgetsPromise) {
		await widgetsPromise;
		return;
	}

	widgetsPromise = new Promise<void>((resolve, reject) => {
		const existing = document.querySelector<HTMLScriptElement>(
			"script[data-twitter-widgets='true']",
		);

		if (existing) {
			if (twitterWindow.twttr?.widgets?.createTweet) {
				resolve();
				return;
			}

			existing.addEventListener("load", () => resolve(), { once: true });
			existing.addEventListener(
				"error",
				() => reject(new Error("failed to load widgets.js")),
				{
					once: true,
				},
			);
			return;
		}

		const script = document.createElement("script");
		script.async = true;
		script.setAttribute("charset", "utf-8");
		script.src = TWITTER_WIDGETS_SRC;
		script.dataset.twitterWidgets = "true";
		script.addEventListener("load", () => resolve(), { once: true });
		script.addEventListener(
			"error",
			() => reject(new Error("failed to load widgets.js")),
			{
				once: true,
			},
		);
		document.head.append(script);
	});

	try {
		await widgetsPromise;
	} catch (error) {
		widgetsPromise = null;
		throw error;
	}
}

async function renderTwitterEmbed(container: HTMLElement): Promise<void> {
	const tweetId = container.dataset.twitterTweetId;
	if (!tweetId) return;

	const theme = getTheme();
	if (
		container.dataset.twitterRenderedTheme === theme &&
		container.dataset.twitterRenderState !== "loading"
	) {
		return;
	}

	if (
		container.dataset.twitterRenderState === "loading" &&
		container.dataset.twitterRequestedTheme === theme
	) {
		return;
	}

	const hasRenderedEmbed = Boolean(container.dataset.twitterRenderedTheme);
	const preserveVisibleEmbed =
		hasRenderedEmbed && container.dataset.twitterRenderedTheme !== theme;
	const renderTarget = createStagingContainer();
	const renderToken = String(++twitterRenderCounter);
	const wrapper = getTwitterWrapper(container);

	container.dataset.twitterRequestedTheme = theme;
	container.dataset.twitterRenderToken = renderToken;
	container.dataset.twitterRenderState = "loading";

	if (!preserveVisibleEmbed && wrapper) {
		wrapper.hidden = true;
	}

	try {
		await ensureWidgets();

		const twitterWindow = window as TwitterWidgetWindow;
		const createTweet = twitterWindow.twttr?.widgets?.createTweet;
		if (!createTweet) {
			throw new Error("createTweet is unavailable");
		}

		await createTweet(tweetId, renderTarget, {
			width: 550,
			theme,
			dnt: true,
			conversation: "none",
			align: "center",
		});

		if (container.dataset.twitterRenderToken !== renderToken) {
			renderTarget.remove();
			return;
		}

		container.replaceChildren(...Array.from(renderTarget.childNodes));
		renderTarget.remove();

		container.dataset.twitterRenderedTheme = theme;
		container.dataset.twitterRenderState = "ready";
		if (wrapper) {
			wrapper.hidden = false;
		}
	} catch {
		if (container.dataset.twitterRenderToken !== renderToken) {
			renderTarget.remove();
			return;
		}

		renderTarget.remove();
		container.dataset.twitterRenderState = "ready";
		delete container.dataset.twitterRenderedTheme;
		if (wrapper && !preserveVisibleEmbed) {
			wrapper.hidden = true;
		}
	}
}

export async function refreshTwitterEmbeds(
	root: ParentNode = document,
): Promise<void> {
	const embeds = Array.from(
		root.querySelectorAll<HTMLElement>("[data-twitter-embed]"),
	);

	await Promise.all(embeds.map((embed) => renderTwitterEmbed(embed)));
}
