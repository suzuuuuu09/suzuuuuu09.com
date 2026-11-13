export const CONTENT_SIGNAL = "search=yes, ai-input=yes, ai-train=no";
export const HOME_LINK = '</llms.txt>; rel="describedby"';

const SECURITY_HEADERS = [
	"Strict-Transport-Security",
	"X-Frame-Options",
	"X-Content-Type-Options",
	"Permissions-Policy",
	"Content-Security-Policy",
];

export interface AssetFetcher {
	fetch(input: string | URL | Request): Promise<Response>;
}

interface MediaRange {
	type: string;
	subtype: string;
	quality: number;
}

function parseQuality(value: string | undefined): number {
	if (value === undefined) return 1;
	const quality = Number(value);
	return Number.isFinite(quality) ? Math.min(1, Math.max(0, quality)) : 0;
}

function parseAccept(header: string | null): MediaRange[] {
	if (!header) return [];
	return header
		.split(",")
		.map((part) => {
			const [mediaType, ...parameters] = part.trim().split(";");
			const [type, subtype] = mediaType.trim().toLowerCase().split("/");
			if (!type || !subtype) return null;
			const qualityParameter = parameters.find((parameter) =>
				parameter.trim().toLowerCase().startsWith("q="),
			);
			return {
				type,
				subtype,
				quality: parseQuality(qualityParameter?.split("=")[1]?.trim()),
			};
		})
		.filter((range): range is MediaRange => range !== null);
}

function qualityFor(
	ranges: MediaRange[],
	type: string,
	subtype: string,
): { quality: number; specificity: number } | null {
	let best: { quality: number; specificity: number } | null = null;
	for (const range of ranges) {
		const matches =
			(range.type === "*" && range.subtype === "*") ||
			(range.type === type &&
				(range.subtype === "*" || range.subtype === subtype));
		if (!matches) continue;
		const specificity = range.type === "*" ? 0 : range.subtype === "*" ? 1 : 2;
		if (
			best === null ||
			specificity > best.specificity ||
			(specificity === best.specificity && range.quality > best.quality)
		) {
			best = { quality: range.quality, specificity };
		}
	}
	return best;
}

export function prefersMarkdown(header: string | null): boolean {
	const ranges = parseAccept(header);
	const markdown = qualityFor(ranges, "text", "markdown");
	if (markdown?.specificity !== 2 || markdown.quality <= 0) return false;
	const html = qualityFor(ranges, "text", "html");
	return markdown.quality > (html?.quality ?? 0);
}

function pageKey(pathname: string): string {
	const path = pathname
		.replace(/\/index\.html?$/i, "/")
		.replace(/\.html?$/i, "")
		.replace(/^\/+|\/+$/g, "");
	return path || "index";
}

export function isContentPage(pathname: string): boolean {
	if (/\.md$/i.test(pathname)) return false;
	const key = pageKey(pathname);
	return (
		!key.startsWith("api/") &&
		!key.startsWith("_") &&
		!key.startsWith("~") &&
		key !== "404"
	);
}

function isDetailKey(key: string): boolean {
	return /^(?:blog|product)\/.+$/.test(key);
}

function markdownCandidates(pathname: string): string[] {
	const key = pageKey(pathname);
	if (key === "index") return ["/_markdown/index.md"];
	if (isDetailKey(key)) return [`/${key}.md`, `/_markdown/${key}.md`];
	return [`/_markdown/${key}.md`];
}

function mergeVary(...headers: (string | null | undefined)[]): string {
	const values: string[] = [];
	for (const header of headers) {
		if (!header) continue;
		for (const entry of header.split(",")) {
			const value = entry.trim();
			if (!value) continue;
			if (value === "*") return "*";
			if (
				!values.some(
					(existing) => existing.toLowerCase() === value.toLowerCase(),
				)
			) {
				values.push(value);
			}
		}
	}
	return values.join(", ");
}

function applyPageHeaders(
	headers: Headers,
	pathname: string,
	htmlHeaders: Headers,
): void {
	headers.set(
		"Vary",
		mergeVary(headers.get("Vary"), htmlHeaders.get("Vary"), "Accept"),
	);
	headers.set("Content-Signal", CONTENT_SIGNAL);
	headers.set("Cloudflare-CDN-Cache-Control", "no-store");
	const preservedLink = htmlHeaders.get("Link");
	if (preservedLink) {
		headers.set("Link", preservedLink);
	}
	if (pageKey(pathname) === "index") {
		const link = headers.get("Link");
		if (!link) {
			headers.set("Link", HOME_LINK);
		} else if (!link.includes("</llms.txt>")) {
			headers.append("Link", HOME_LINK);
		}
	}
}

function copySecurityHeaders(target: Headers, source: Headers): void {
	for (const name of SECURITY_HEADERS) {
		const value = source.get(name);
		if (value !== null && !target.has(name)) target.set(name, value);
	}
}

const REPRESENTATION_HEADERS = [
	"If-Match",
	"If-None-Match",
	"If-Modified-Since",
	"If-Unmodified-Since",
	"Range",
	"If-Range",
];

export function staticAssetRequest(request: Request): Request {
	const headers = new Headers(request.headers);
	if (prefersMarkdown(request.headers.get("Accept"))) {
		for (const name of REPRESENTATION_HEADERS) {
			headers.delete(name);
		}
	}
	return new Request(request, { headers, redirect: "manual" });
}

async function fetchMarkdown(
	request: Request,
	assets: AssetFetcher,
	candidates: string[],
): Promise<Response | null> {
	const headers = new Headers({
		Accept: "text/markdown",
		"Accept-Encoding": "identity",
	});

	for (const candidate of candidates) {
		const assetRequest = new Request(new URL(candidate, request.url), {
			method: "GET",
			headers,
		});
		try {
			const response = await assets.fetch(assetRequest);
			if (response.status === 200) return response;
		} catch {
			continue;
		}
	}
	return null;
}

export async function negotiateMarkdown(
	request: Request,
	response: Response,
	assets: AssetFetcher,
): Promise<Response> {
	if (request.method !== "GET" && request.method !== "HEAD") return response;

	const { pathname } = new URL(request.url);
	if (!isContentPage(pathname)) return response;

	if (response.status === 304) {
		const headers = new Headers(response.headers);
		applyPageHeaders(headers, pathname, response.headers);
		return new Response(null, {
			status: response.status,
			statusText: response.statusText,
			headers,
		});
	}

	if (response.status !== 200 && response.status !== 206) return response;

	const contentType = response.headers.get("content-type") ?? "";
	if (!contentType.toLowerCase().includes("text/html")) return response;

	const markdown =
		response.status === 200 && prefersMarkdown(request.headers.get("Accept"))
			? await fetchMarkdown(request, assets, markdownCandidates(pathname))
			: null;

	if (markdown === null) {
		const headers = new Headers(response.headers);
		applyPageHeaders(headers, pathname, response.headers);
		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers,
		});
	}

	await response.body?.cancel();

	const headers = new Headers(markdown.headers);
	copySecurityHeaders(headers, response.headers);
	headers.set("Content-Type", "text/markdown; charset=utf-8");
	headers.set("Cache-Control", "no-store");
	headers.set("Cloudflare-CDN-Cache-Control", "no-store");
	headers.set("Content-Signal", CONTENT_SIGNAL);
	applyPageHeaders(headers, pathname, response.headers);
	headers.delete("Content-Length");
	headers.delete("Content-Encoding");

	if (request.method === "HEAD") {
		await markdown.body?.cancel();
	}

	return new Response(request.method === "HEAD" ? null : markdown.body, {
		status: 200,
		headers,
	});
}
