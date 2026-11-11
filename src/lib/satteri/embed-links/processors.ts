import * as Detect from "./detect";
import { fetchOGP } from "./ogs";
import * as Templates from "./templates";
import type {
	EmbedContext,
	EmbedResult,
	OgpCache,
	OgpData,
	ServiceType,
} from "./types";

const EMBED_REQUEST_TIMEOUT_MS = 5000;

export async function fetchOembedHtml(url: string): Promise<string | null> {
	const controller = new AbortController();
	let timeout: ReturnType<typeof setTimeout> | undefined;
	const timeoutPromise = new Promise<null>((resolve) => {
		timeout = setTimeout(() => {
			controller.abort();
			resolve(null);
		}, EMBED_REQUEST_TIMEOUT_MS);
	});

	try {
		const response = await Promise.race([
			fetch(url, { signal: controller.signal }),
			timeoutPromise,
		]);
		if (!response?.ok) return null;

		const data = await Promise.race([response.json(), timeoutPromise]);
		if (
			typeof data === "object" &&
			data !== null &&
			"html" in data &&
			typeof data.html === "string"
		) {
			return data.html;
		}
	} catch {
		return null;
	} finally {
		if (timeout) clearTimeout(timeout);
	}

	return null;
}

// キャッシュ付きOGP取得ヘルパー
async function fetchOgpWithCache(
	url: string,
	cache: OgpCache,
	fetcher: (url: string) => Promise<OgpData>,
): Promise<OgpData> {
	const cached = cache.get(url);
	if (cached) return cached;

	const ogpData = await fetcher(url);
	cache.set(url, ogpData);
	return ogpData;
}

function embedResult(html: string, wrapperClass?: string): EmbedResult {
	return { html, wrapperClass };
}

export async function processLink(
	ctx: EmbedContext,
	urlType: ServiceType,
): Promise<EmbedResult | null> {
	switch (urlType) {
		case "youtube":
			return processOembed(
				ctx,
				"https://www.youtube.com/oembed",
				"youtube-embed",
				{ format: "json", fillContainer: true },
			);
		case "youtube-shorts":
			return processOembed(
				ctx,
				"https://www.youtube.com/oembed",
				"youtube-shorts-embed",
				{ format: "json", fillContainer: true },
			);
		case "twitter":
			return processTwitter(ctx);
		case "spotify":
			return processOembed(
				ctx,
				"https://open.spotify.com/oembed",
				"spotify-embed",
			);
		case "soundcloud":
			return processOembed(
				ctx,
				"https://soundcloud.com/oembed",
				"soundcloud-embed",
				{ format: "json" },
			);
		case "google-slides":
			return processGoogleSlides(ctx);
		case "github-gist":
			return processGithubGist(ctx);
		case "codepen":
			return processCodepen(ctx);
		case "hatena-blog":
			return processOembed(
				ctx,
				"https://hatena.blog/oembed",
				"hatena-blog-embed",
				{ format: "json" },
			);
		case "note":
			return processNote(ctx);
		case "reddit":
			return processOembed(
				ctx,
				"https://www.reddit.com/oembed",
				"reddit-embed",
			);
		case "speaker-deck":
			return processOembed(
				ctx,
				"https://speakerdeck.com/oembed.json",
				"speaker-deck-embed",
				{ fillContainer: true },
			);
		case "other":
			return processOgpCard(ctx, "other");
		case "skip":
			return null;
	}
}

interface OembedOptions {
	format?: string;
	fillContainer?: boolean;
}

async function processOembed(
	ctx: EmbedContext,
	endpoint: string,
	wrapperClass: string,
	{ format, fillContainer = false }: OembedOptions = {},
): Promise<EmbedResult | null> {
	const formatQuery = format ? `format=${format}&` : "";
	let embedHtml = await (ctx.fetchOembedHtml ?? fetchOembedHtml)(
		`${endpoint}?${formatQuery}url=${encodeURIComponent(ctx.url)}`,
	);
	if (!embedHtml) return null;

	if (fillContainer) {
		embedHtml = embedHtml
			.replaceAll(/width=["']?\d+["']?/g, 'width="100%"')
			.replaceAll(/height=["']?\d+["']?/g, 'height="100%"');
	}

	return embedResult(embedHtml, wrapperClass);
}

// --- 各サービス用プロセッサ ---

export async function processTwitter(
	ctx: EmbedContext,
): Promise<EmbedResult | null> {
	const tweetId = Detect.extractTwitterId(ctx.url);

	if (tweetId) {
		const html = Templates.generateTwitterEmbedHtml(ctx.url, tweetId);
		return embedResult(html, "twitter-embed");
	}

	// ユーザーページ等はOGPカード
	return processOgpCard(ctx, "twitter");
}

export async function processGoogleSlides(
	ctx: EmbedContext,
): Promise<EmbedResult | null> {
	const embedUrl = Detect.convertToGoogleSlidesEmbedUrl(ctx.url);
	if (!embedUrl) return null;

	const html = Templates.generateGoogleSlidesEmbedHtml(embedUrl, ctx.linkTitle);
	return embedResult(html);
}

export async function processGithubGist(
	ctx: EmbedContext,
): Promise<EmbedResult> {
	const html = Templates.generateGithubGistEmbedHtml(ctx.url);
	return embedResult(html);
}

export async function processCodepen(
	ctx: EmbedContext,
): Promise<EmbedResult | null> {
	// NOTE: CodePenでoEmbedが使えないので、slug/hashを抽出して手動で埋め込みコードを生成
	const slugHash = Detect.extractCodepenSlugHash(ctx.url);
	if (!slugHash) return null;

	const html = Templates.generateCodepenEmbedHtml(slugHash);
	return embedResult(html);
}

export async function processNote(
	ctx: EmbedContext,
): Promise<EmbedResult | null> {
	const articleId = Detect.extractNoteArticleId(ctx.url);

	if (!articleId) return null;

	const embedUrl = `https://note.com/embed/notes/${articleId}`;
	const html = Templates.generateNoteEmbedHtml(embedUrl);

	// Noteは特殊なiframe構造を持っていたため、wrapperClassを指定して再現
	return embedResult(html, "note-embed");
}

export async function processOgpCard(
	ctx: EmbedContext,
	typeOverride?: string,
): Promise<EmbedResult> {
	const ogpData = await fetchOgpWithCache(
		ctx.url,
		ctx.cache,
		ctx.fetchOGP ?? fetchOGP,
	);
	const typeClass = typeOverride || "external";
	const html = Templates.generateCardHtml(
		ctx.url,
		ogpData,
		ctx.linkTitle,
		typeClass,
	);

	return embedResult(html);
}
