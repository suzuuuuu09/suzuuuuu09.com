import type { HastNode } from "satteri";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

type Element = Extract<HastNode, { type: "element" }>;
type Root = Extract<HastNode, { type: "root" }>;

type CaptionType = "image" | "video" | "table";

type Caption = {
	type: CaptionType;
	text: string;
};

type ParentLike = {
	readonly type: string;
	readonly tagName?: string;
	readonly children: readonly unknown[];
};

type NodeLike = {
	readonly type: string;
	readonly tagName?: string;
	readonly value?: string;
};

const captionRegex = /^\[!(image|video|table)\]\s*(.+)$/;

function isNodeLike(node: unknown): node is NodeLike {
	return typeof node === "object" && node !== null && "type" in node;
}

function isWhitespace(node: unknown): boolean {
	return isNodeLike(node) && node.type === "text" && !node.value?.trim();
}

function startsOnNextLine(node: unknown): boolean {
	if (!isNodeLike(node) || node.type !== "text") return false;
	const firstNonWhitespace = node.value?.search(/\S/) ?? -1;
	return (
		firstNonWhitespace === -1 ||
		node.value?.slice(0, firstNonWhitespace).includes("\n") === true
	);
}

function endsOnPreviousLine(node: unknown): boolean {
	if (!isNodeLike(node)) return true;
	if (node.type !== "text") return node.tagName === "br";
	return isWhitespace(node) || node.value?.endsWith("\n") === true;
}

function isStandalone(
	parent: ParentLike | undefined,
	index: number | undefined,
): boolean {
	if (
		parent?.type !== "element" ||
		parent.tagName !== "p" ||
		index === undefined
	)
		return false;
	if (!endsOnPreviousLine(parent.children[index - 1])) return false;

	let nextLine = false;
	return parent.children.slice(index + 1).every((child) => {
		if (nextLine || isWhitespace(child)) return true;
		if (startsOnNextLine(child)) return (nextLine = true);
		if (isNodeLike(child) && child.tagName === "br") return (nextLine = true);
		return false;
	});
}

function parseCaption(node: Readonly<Element>): Caption | undefined {
	if (node.tagName !== "em" || node.children.length !== 1) return;

	const child = node.children[0];
	if (child.type !== "text") return;

	const match = captionRegex.exec(child.value.trim());
	if (!match) return;

	return {
		type: match[1] as CaptionType,
		text: match[2].trim(),
	};
}

function mdiIcon(type: CaptionType): string {
	const icons: Record<CaptionType, string> = {
		image: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM5 19v-4l3.5-4.5L12 15l4.5-6L19 11v8H5z"/></svg>`,
		video: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="m18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4z"/></svg>`,
		table: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M4 3h16a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2m0 4v3h4V7zm6 0v3h4V7zm10 3V7h-4v3zM4 12v3h4v-3zm0 8h4v-3H4zm6-8v3h4v-3zm0 8h4v-3h-4zm10 0v-3h-4v3zm0-8h-4v3h4z"/></svg>`,
	};
	return icons[type];
}

function createCaptionNode({ type, text }: Caption): Element {
	return {
		type: "element",
		tagName: "figcaption",
		properties: { className: [`caption caption-${type}`] },
		children: [
			{ type: "raw", value: mdiIcon(type) },
			{
				type: "element",
				tagName: "span",
				properties: {},
				children: [{ type: "text", value: text }],
			},
		],
	};
}

export const unifiedCaption: Plugin<[], Root> = () => (tree) => {
	visit(tree, "element", (node, index, parent) => {
		if (!parent || typeof index !== "number" || !isStandalone(parent, index)) {
			return;
		}

		const parsed = parseCaption(node);
		if (parsed) parent.children[index] = createCaptionNode(parsed);
	});
};
