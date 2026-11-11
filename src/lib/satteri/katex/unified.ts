import type { Html, Root } from "mdast";
import type { InlineMath, Math } from "mdast-util-math";
import satteriKatex from "satteri-katex";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

type MathNode = InlineMath | Math;
type KatexVisitor = (node: Readonly<MathNode>) => Html;

const katex = satteriKatex() as unknown as {
	inlineMath: KatexVisitor;
	math: KatexVisitor;
};

const unifiedSatteriKatex: Plugin<[], Root> = () => (tree) => {
	visit(tree, "inlineMath", (node, index, parent) => {
		if (index === undefined || !parent) return;

		parent.children[index] = katex.inlineMath(node);
		return index;
	});

	visit(tree, "math", (node, index, parent) => {
		if (index === undefined || !parent) return;

		parent.children[index] = katex.math(node);
		return index;
	});
};

export default unifiedSatteriKatex;
