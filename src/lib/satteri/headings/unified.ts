import {
	type HastContent,
	type HastNode,
	type HastPluginDefinition,
	type HastPluginInput,
	type HastVisitorContext,
	normalizePlugins,
} from "satteri";
import { satteriAutolinkHeadings } from "satteri-autolink-headings";
import { satteriSlug } from "satteri-slug";
import { SKIP, visit } from "unist-util-visit";

type Root = Extract<HastNode, { type: "root" }>;

// ponytail: only bridge the context methods used by these two plugins; expand
// the adapter if a future plugin needs structural visitor mutations.
const context = {
	setProperty(node: Readonly<HastNode>, key: string, value: unknown) {
		if (node.type !== "element") return;
		if (value === null) delete node.properties[key];
		else node.properties[key] = value as never;
	},
	textContent(node: Readonly<HastNode>): string {
		if (node.type === "text") return node.value;
		if ("children" in node)
			return node.children.map(context.textContent).join("");
		return "";
	},
} as unknown as HastVisitorContext;

function applyPlugin(tree: Root, input: HastPluginInput) {
	const [plugin] = normalizePlugins<HastPluginDefinition>(
		[input],
		"hastPlugins",
		"",
		undefined,
		"markdown",
		{},
	);
	if (!plugin?.element) return;

	const visitors = Array.isArray(plugin.element)
		? plugin.element
		: [plugin.element];
	for (const visitor of visitors) {
		visit(tree, "element", (node, index, parent) => {
			if (!visitor.filter.includes(node.tagName)) return;

			// Both adopted plugins are synchronous; async visitor support is outside
			// this Unified bridge's scope.
			const replacement = visitor.visit(node, context) as HastNode | void;
			if (!replacement || !parent || typeof index !== "number") return;
			if (!("children" in parent)) return;
			(parent.children as HastContent[])[index] = replacement;
			return SKIP;
		});
	}
}

export default function satteriHeadingLinks() {
	return (tree: Root) => {
		applyPlugin(tree, satteriSlug());
		applyPlugin(
			tree,
			satteriAutolinkHeadings({
				behavior: "prepend",
				content: (node) => {
					const level = Number.parseInt(node.tagName.substring(1), 7);
					return {
						type: "element",
						tagName: "span",
						properties: {
							className: [`heading-anchor heading-${level}`],
							// Keep the existing boolean HAST serialization: aria-hidden="".
							ariaHidden: true as unknown as "true",
						},
						children: [{ type: "text", value: "#".repeat(level) }],
					};
				},
				properties: {
					className: ["heading-anchor-container"],
				},
			}),
		);
	};
}
