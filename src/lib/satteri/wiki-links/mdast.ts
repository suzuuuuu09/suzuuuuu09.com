import type { Html, Link, PhrasingContent, Text } from "mdast";
import { R2_URL } from "../../../consts/base";

const wikiLinkRegex = /(!)?\[\[(.*?)(?:\|(.*?))?\]\]/g;
const mediaExtensionRegex = /\.(jpe?g|png|gif|webp|avif|svg|mp4|webm|mov)$/i;
const videoExtensionRegex = /\.(mp4|webm|mov)$/i;

function escapeHtmlAttribute(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll('"', "&quot;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;");
}

function parseDimensions(value?: string): string {
	if (!value) return "";

	const dimensions = value.trim().match(/^(\d+)(?:x(\d+))?$/i);
	if (!dimensions) return "";

	const [, width, height] = dimensions;
	return height ? ` width="${width}" height="${height}"` : ` width="${width}"`;
}

function resolveMediaUrl(path: string): string {
	if (path.startsWith("assets/")) return `${R2_URL}/${path}`;
	if (mediaExtensionRegex.test(path) && !path.includes("/")) {
		return `${R2_URL}/assets/${path}`;
	}
	return path;
}

function text(value: string): Text {
	return { type: "text", value };
}

function mediaNode(path: string, dimensionValue?: string): Html {
	const safePath = escapeHtmlAttribute(path);
	const safeUrl = escapeHtmlAttribute(resolveMediaUrl(path));
	const dimensions = parseDimensions(dimensionValue);

	if (videoExtensionRegex.test(path)) {
		return {
			type: "html",
			value: `<video src="${safeUrl}" controls${dimensions || ' width="100%"'} alt="${safePath}"></video>`,
		};
	}

	return {
		type: "html",
		value: `<img src="${safeUrl}" alt="${safePath}" loading="lazy" decoding="async"${dimensions} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 800px" style="max-width: 100%; height: auto;" data-zoomable />`,
	};
}

export function toWikiLinkNodes(value: string): PhrasingContent[] | undefined {
	const parts: PhrasingContent[] = [];
	let lastIndex = 0;
	let match: RegExpExecArray | null;

	wikiLinkRegex.lastIndex = 0;
	while ((match = wikiLinkRegex.exec(value)) !== null) {
		if (match.index > lastIndex)
			parts.push(text(value.slice(lastIndex, match.index)));

		const [, media, path, label] = match;
		if (media) {
			parts.push(mediaNode(path, label));
		} else {
			const linkNode: Link = {
				type: "link",
				url: path,
				children: [text(label || path)],
			};
			parts.push(linkNode);
		}

		lastIndex = match.index + match[0].length;
	}

	if (parts.length === 0) return;
	if (lastIndex < value.length) parts.push(text(value.slice(lastIndex)));
	return parts;
}
