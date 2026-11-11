import type { PhrasingContent, Root } from "mdast";
import type {
	CompileContext,
	Extension as FromMarkdownExtension,
} from "mdast-util-from-markdown";
import { fromMarkdown } from "mdast-util-from-markdown";
import { splice } from "micromark-util-chunked";
import { classifyCharacter } from "micromark-util-classify-character";
import { resolveAll } from "micromark-util-resolve-all";
import type {
	Event,
	Extension as MicromarkExtension,
	Token,
	TokenizeContext,
	Tokenizer,
} from "micromark-util-types";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

declare module "micromark-util-types" {
	interface TokenTypeMap {
		obsidianComment: "obsidianComment";
		obsidianCommentSequence: "obsidianCommentSequence";
		obsidianCommentSequenceTemporary: "obsidianCommentSequenceTemporary";
		obsidianCommentText: "obsidianCommentText";
		obsidianMark: "obsidianMark";
		obsidianMarkSequence: "obsidianMarkSequence";
		obsidianMarkSequenceTemporary: "obsidianMarkSequenceTemporary";
		obsidianMarkText: "obsidianMarkText";
	}

	interface Token {
		_open?: boolean;
		_close?: boolean;
	}
}

type ObsidianKind = "mark" | "comment";

const tokenNames = {
	mark: {
		container: "obsidianMark",
		sequence: "obsidianMarkSequence",
		text: "obsidianMarkText",
	},
	comment: {
		container: "obsidianComment",
		sequence: "obsidianCommentSequence",
		text: "obsidianCommentText",
	},
} as const satisfies Record<ObsidianKind, Record<string, string>>;

function obsidianSyntax(): MicromarkExtension {
	const comment = createConstruct("comment", 37);
	const mark = createConstruct("mark", 61);

	return {
		text: {
			37: [comment],
			61: [mark],
		},
		insideSpan: {
			null: [comment, mark],
		},
	};
}

function createConstruct(kind: ObsidianKind, marker: number) {
	return {
		name: `obsidian-${kind}`,
		tokenize: createTokenizer(kind, marker),
		resolveAll: resolveObsidian,
	};
}

function createTokenizer(kind: ObsidianKind, marker: number): Tokenizer {
	const name = tokenNames[kind].sequence;

	return function tokenizeObsidian(effects, ok, nok) {
		const previous = this.previous;
		let size = 0;

		return start;

		function start(code: number | null) {
			if (code !== marker || previous === marker) {
				return nok(code);
			}

			effects.enter(`${name}Temporary`);
			return more(code);
		}

		function more(code: number | null) {
			if (code === marker) {
				if (size > 1) return nok(code);
				effects.consume(code);
				size++;
				return more;
			}
			if (size < 2) return nok(code);

			const token = effects.exit(`${name}Temporary`);
			const before = classifyCharacter(previous);
			const after = classifyCharacter(code);

			token._open = after !== 1;
			token._close = before !== 1;

			return ok(code);
		}
	};
}

function resolveObsidian(events: Event[], context: TokenizeContext): Event[] {
	const openers: Record<ObsidianKind, Token[]> = { mark: [], comment: [] };
	const pairs: Array<{ opener: Token; closer: Token }> = [];
	const closedTokens = new Set<Token>();

	for (let index = 0; index < events.length; index++) {
		const [kind, token] = events[index];
		if (!token.type.endsWith("SequenceTemporary")) continue;
		const tokenKind = token.type.startsWith("obsidianMark")
			? "mark"
			: "comment";
		const tokenOpeners = openers[tokenKind];

		if (kind === "enter" && token._close) {
			const opener = tokenOpeners.at(-1);
			if (opener && opener.start.line === token.start.line) {
				pairs.push({ opener, closer: token });
				tokenOpeners.pop();
				closedTokens.add(token);
			}
		}

		if (kind === "exit" && token._open && !closedTokens.has(token)) {
			tokenOpeners.push(token);
		}
	}

	const crossingPairs = new Set(pairs);
	for (let left = 0; left < pairs.length; left++) {
		for (let right = left + 1; right < pairs.length; right++) {
			const first = pairs[left];
			const second = pairs[right];
			const firstStart = first.opener.start.offset;
			const firstEnd = first.closer.end.offset;
			const secondStart = second.opener.start.offset;
			const secondEnd = second.closer.end.offset;
			const crosses =
				(firstStart < secondStart &&
					secondStart < firstEnd &&
					firstEnd < secondEnd) ||
				(secondStart < firstStart &&
					firstStart < secondEnd &&
					secondEnd < firstEnd);
			if (crosses) {
				crossingPairs.delete(first);
				crossingPairs.delete(second);
			}
		}
	}

	const validPairs = pairs.filter((pair) => crossingPairs.has(pair));

	for (const pair of validPairs.sort((a, b) => {
		const aLength = a.closer.end.offset - a.opener.start.offset;
		const bLength = b.closer.end.offset - b.opener.start.offset;
		return aLength - bLength;
	})) {
		const openerExit = events.findIndex(
			([kind, token]) => kind === "exit" && token === pair.opener,
		);
		const closerEnter = events.findIndex(
			([kind, token]) => kind === "enter" && token === pair.closer,
		);
		if (openerExit < 1 || closerEnter <= openerExit) continue;

		const kind = pair.opener.type.startsWith("obsidianMark")
			? "mark"
			: "comment";
		const names = tokenNames[kind];
		pair.opener.type = names.sequence;
		pair.closer.type = names.sequence;
		const container: Token = {
			type: names.container,
			start: { ...pair.opener.start },
			end: { ...pair.closer.end },
		};
		const text: Token = {
			type: names.text,
			start: { ...pair.opener.end },
			end: { ...pair.closer.start },
		};
		const content = events.slice(openerExit + 1, closerEnter);
		const insideSpan = context.parser.constructs.insideSpan.null;
		const nextEvents: Event[] = [
			["enter", container, context],
			["enter", pair.opener, context],
			["exit", pair.opener, context],
			["enter", text, context],
		];

		if (insideSpan) {
			splice(
				nextEvents,
				nextEvents.length,
				0,
				resolveAll(insideSpan, content, context),
			);
		} else {
			splice(nextEvents, nextEvents.length, 0, content);
		}

		splice(nextEvents, nextEvents.length, 0, [
			["exit", text, context],
			["enter", pair.closer, context],
			["exit", pair.closer, context],
			["exit", container, context],
		]);
		splice(events, openerExit - 1, closerEnter - openerExit + 3, nextEvents);
	}

	for (const [, token] of events) {
		if (token.type.endsWith("SequenceTemporary")) token.type = "data";
	}

	return events;
}

function obsidianFromMarkdown(): FromMarkdownExtension {
	return {
		enter: {
			obsidianMark: enterMark,
			obsidianComment: enterComment,
		},
		exit: {
			obsidianMark: exitContainer,
			obsidianComment: exitContainer,
		},
	};
}

function enterMark(this: FromMarkdownContext, token: Token) {
	this.enter(
		{
			type: "obsidianMark",
			children: [],
			data: { hName: "mark" },
		} as unknown as PhrasingContent,
		token,
	);
}

function enterComment(this: FromMarkdownContext, token: Token) {
	this.enter(
		{
			type: "obsidianComment",
			children: [],
		} as unknown as PhrasingContent,
		token,
	);
}

function exitContainer(this: FromMarkdownContext, token: Token) {
	this.exit(token);
}

type FromMarkdownContext = CompileContext;

const isComment = (node: { type: string }) => node.type === "obsidianComment";

const remarkObsidian: Plugin<[], Root> = function () {
	const data = this.data();
	const micromarkExtensions =
		data.micromarkExtensions || (data.micromarkExtensions = []);
	const fromMarkdownExtensions =
		data.fromMarkdownExtensions || (data.fromMarkdownExtensions = []);

	micromarkExtensions.push(obsidianSyntax());
	fromMarkdownExtensions.push(obsidianFromMarkdown());

	return (tree: Root) => {
		visit(tree, isComment, (_node, index, parent) => {
			if (parent && typeof index === "number") {
				parent.children.splice(index, 1);
				return index;
			}
		});
		return tree;
	};
};

export function stripObsidianComments(markdown: string): string {
	const tree = fromMarkdown(markdown, {
		extensions: [obsidianSyntax()],
		mdastExtensions: [obsidianFromMarkdown()],
	});
	const ranges: Array<[number, number]> = [];

	visit(tree, isComment, (node) => {
		if (node.position) {
			ranges.push([
				node.position.start.offset ?? 0,
				node.position.end.offset ?? 0,
			]);
		}
	});
	const mergedRanges = ranges
		.sort(([a], [b]) => a - b)
		.reduce<Array<[number, number]>>((merged, range) => {
			const previous = merged.at(-1);
			if (previous && range[0] <= previous[1]) {
				previous[1] = Math.max(previous[1], range[1]);
			} else {
				merged.push([...range]);
			}
			return merged;
		}, []);
	let result = markdown;
	for (const [start, end] of mergedRanges.reverse()) {
		result = result.slice(0, start) + result.slice(end);
	}
	return result;
}

export default remarkObsidian;
