import type { Html, Link, Paragraph } from "mdast";
import type { EmbedResult } from "./types";

export function getLinkTitle(node: Readonly<Link>): string {
	return node.children[0]?.type === "text" ? node.children[0].value : "";
}

export function toEmbedNode(result: EmbedResult): Html | Paragraph {
	const htmlNode: Html = {
		type: "html",
		value: result.html,
	};
	if (!result.wrapperClass) return htmlNode;

	return {
		type: "paragraph",
		data: {
			hName: "div",
			hProperties: { className: [result.wrapperClass] },
		},
		children: [htmlNode],
	};
}
