import type { Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import { detectLinkType } from "./detect";
import { getLinkTitle, toEmbedNode } from "./mdast";
import { processLink } from "./processors";
import type {
	EmbedContext,
	OgpCache,
	SatteriEmbedLinksOptions,
} from "./types";

export function createUnifiedEmbedLinks(
	options: SatteriEmbedLinksOptions = {},
): Plugin<[], Root> {
	return () => {
		const cache: OgpCache = new Map();

		return async (tree: Root) => {
			const pending: Promise<void>[] = [];

			visit(tree, "link", (node, index, parent) => {
				if (!parent || typeof index !== "number") return;

				const urlType = detectLinkType(node);
				if (urlType === "skip") return;

				pending.push(
					(async () => {
						const ctx: EmbedContext = {
							url: node.url,
							linkTitle: getLinkTitle(node),
							cache,
							...options,
						};
						const result = await processLink(ctx, urlType);
						if (!result) return;

						parent.children[index] = toEmbedNode(result);
					})(),
				);
			});

			await Promise.all(pending);
		};
	};
}

export default createUnifiedEmbedLinks();
