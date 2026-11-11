export interface OgpData {
	title?: string;
	description?: string;
	site_name?: string;
	image?: string;
	favicon?: string;
	[key: string]: string | undefined; // 拡張性を維持しつつ型安全に
}

// 処理可能なサービスのリスト
export type ServiceType =
	| "youtube"
	| "youtube-shorts"
	| "twitter"
	| "spotify"
	| "soundcloud"
	| "google-slides"
	| "github-gist"
	| "codepen"
	| "hatena-blog"
	| "note"
	| "reddit"
	| "speaker-deck"
	| "other"
	| "skip";

// キャッシュの型定義
export type OgpCache = Map<string, OgpData>;

export type OembedFetcher = (url: string) => Promise<string | null>;
export type OgpFetcher = (url: string) => Promise<OgpData>;

export interface SatteriEmbedLinksOptions {
	fetchOembedHtml?: OembedFetcher;
	fetchOGP?: OgpFetcher;
}

export interface EmbedResult {
	html: string;
	wrapperClass?: string;
}

// 共通coreに渡すコンテキスト
export interface EmbedContext {
	url: string;
	linkTitle: string;
	cache: OgpCache;
	fetchOembedHtml?: OembedFetcher;
	fetchOGP?: OgpFetcher;
}
