import type { Link } from "mdast";
import type { ServiceType } from "./types";

/**
 * URLのタイプを判定する
 */
export function detectUrlType(url: string): ServiceType {
	let parsedUrl: URL;
	try {
		parsedUrl = new URL(url);
	} catch {
		return "skip";
	}

	if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
		return "skip";
	}

	const hostname = parsedUrl.hostname.toLowerCase();
	const isHost = (host: string) =>
		hostname === host || hostname.endsWith(`.${host}`);

	if (isHost("youtube.com") && parsedUrl.pathname.startsWith("/shorts/")) {
		return "youtube-shorts";
	}

	if (
		(isHost("youtube.com") &&
			parsedUrl.pathname === "/watch" &&
			parsedUrl.searchParams.has("v")) ||
		(isHost("youtu.be") && parsedUrl.pathname.length > 1)
	) {
		return "youtube";
	}

	if (isHost("x.com") || isHost("twitter.com")) return "twitter";
	if (isHost("open.spotify.com")) return "spotify";
	if (
		isHost("docs.google.com") &&
		(parsedUrl.pathname === "/presentation" ||
			parsedUrl.pathname.startsWith("/presentation/"))
	) {
		return "google-slides";
	}
	if (isHost("gist.github.com")) return "github-gist";
	if (isHost("codepen.io")) return "codepen";
	if (isHost("hatenablog.com")) return "hatena-blog";
	if (isHost("note.com")) return "note";
	if (isHost("soundcloud.com")) return "soundcloud";
	if (isHost("reddit.com")) return "reddit";
	if (isHost("speakerdeck.com")) return "speaker-deck";

	return "other";
}

export function detectLinkType(node: Readonly<Link>): ServiceType {
	if (node.children?.[0]?.type === "inlineCode") return "skip";
	return detectUrlType(node.url);
}

export function extractTwitterId(url: string): string | null {
	// try-catch回避のため正規表現のみで抽出
	// x.com または twitter.com の /username/status/tweetId 形式
	const regex =
		/^https?:\/\/(?:www\.)?(?:x\.com|twitter\.com)\/[^/]+\/status\/(\d+)/;
	const match = regex.exec(url);
	return match ? match[1] : null;
}

export function convertToGoogleSlidesEmbedUrl(url: string): string | null {
	// 公開用URL: /presentation/d/e/{long-id}/pub
	const pubMatch = /\/presentation\/d\/e\/(2PACX-[a-zA-Z0-9_-]+)/.exec(url);
	if (pubMatch) {
		const presentationId = pubMatch[1];
		return `https://docs.google.com/presentation/d/e/${presentationId}/pubembed?start=false&loop=false&delayms=3000`;
	}

	// 編集用URLなど: /presentation/d/{id}/edit -> embed
	const idMatch = /\/presentation\/d\/([a-zA-Z0-9_-]+)/.exec(url);
	if (idMatch && !url.includes("/e/")) {
		// /e/ (publish) を除外
		const presentationId = idMatch[1];
		// 既にembedが含まれているかチェック
		if (url.includes("/embed") || url.includes("/pubembed")) {
			return url;
		}
		return `https://docs.google.com/presentation/d/${presentationId}/embed?start=false&loop=false&delayms=3000`;
	}

	return null;
}

export function extractCodepenSlugHash(url: string): string | null {
	const match = /\/pen\/([a-zA-Z0-9_-]+)/.exec(url);
	return match ? match[1] : null;
}

export function extractNoteArticleId(url: string): string | null {
	const match = /note\.com\/[^/]+\/n\/([a-z0-9]+)/.exec(url);
	return match ? match[1] : null;
}
