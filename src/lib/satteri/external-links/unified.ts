import type { Element, ElementContent, Root } from "hast";
import type { HastNode } from "satteri";
import satteriExternalLinks from "satteri-external-links";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

type Options = Parameters<typeof satteriExternalLinks>[0];

export function createUnifiedExternalLinks(
	options?: Options,
): Plugin<[], Root> {
	const visitor = satteriExternalLinks(options).element;
	if (!visitor || Array.isArray(visitor)) {
		throw new Error("satteri-external-links must expose one element visitor");
	}

	return () => (tree) => {
		visit(tree, "element", (node) => {
			if (!visitor.filter.includes(node.tagName)) return;

			visitor.visit(
				node as never,
				{
					setProperty(element: HastNode, key: string, value: unknown) {
						(element as Element).properties[key] =
							value as Element["properties"][string];
					},
					appendChild(element: HastNode, child: HastNode | HastNode[]) {
						(element as Element).children.push(
							...((Array.isArray(child) ? child : [child]) as ElementContent[]),
						);
					},
				} as never,
			);
		});
	};
}
