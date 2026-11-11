import twemoji from "twemoji";

const SKIP_EMOJI_SELECTOR = "pre, code, kbd, samp, script, style, textarea";

const twemojiOptions = {
	folder: "svg",
	ext: ".svg",
	attributes: () => {
		return {
			loading: "lazy",
			decoding: "async",
		};
	},
};

function collectEmojiTextNodes(root: ParentNode): Text[] {
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
		acceptNode(node) {
			const text = node.nodeValue ?? "";
			if (!text.trim()) return NodeFilter.FILTER_REJECT;

			const parentElement = node.parentElement;
			if (parentElement?.closest(SKIP_EMOJI_SELECTOR)) {
				return NodeFilter.FILTER_REJECT;
			}

			return NodeFilter.FILTER_ACCEPT;
		},
	});

	const nodes: Text[] = [];
	let currentNode = walker.nextNode();
	while (currentNode) {
		nodes.push(currentNode as Text);
		currentNode = walker.nextNode();
	}

	return nodes;
}

function replaceTextNodeWithEmojiImages(node: Text) {
	const text = node.nodeValue ?? "";
	const parsed = twemoji.parse(text, twemojiOptions);

	if (parsed === text || !node.parentNode) return;

	const template = document.createElement("template");
	template.innerHTML = parsed;
	node.parentNode.replaceChild(template.content, node);
}

// Twemojiの初期化
export function initTwemoji() {
	const emojiTextNodes = collectEmojiTextNodes(document.body);

	for (const textNode of emojiTextNodes) {
		replaceTextNodeWithEmojiImages(textNode);
	}
}
