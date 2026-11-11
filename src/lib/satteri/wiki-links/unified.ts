import type { Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import { toWikiLinkNodes } from "./mdast";

const unifiedWikiLinks: Plugin<[], Root> = () => (tree) => {
	visit(tree, "text", (node, index, parent) => {
		if (index === undefined || !parent) return;

		const replacement = toWikiLinkNodes(node.value);
		if (!replacement) return;

		parent.children.splice(index, 1, ...replacement);
		return index + replacement.length;
	});
};

export default unifiedWikiLinks;
