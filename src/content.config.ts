import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { contentPatterns } from "./lib/published-content.mjs";

// 共通のスキーマ
const commonSchema = z.object({
	title: z.string(),
	author: z.string().optional(),
	slug: z.string(),
	tags: z.preprocess((val) => val ?? [], z.array(z.string())),
	description: z.string().nullable().default(""),
	isPublish: z.boolean().default(false),
});

const optionalCareerDate = z.preprocess(
	(value) =>
		value === null || (typeof value === "string" && value.trim() === "")
			? undefined
			: value,
	z.union([z.date(), z.string(), z.number()]).pipe(z.coerce.date()).optional(),
);
const optionalCareerTitle = z.preprocess(
	(value) =>
		value === null || (typeof value === "string" && value.trim() === "")
			? undefined
			: value,
	z.string().optional(),
);

const blogSchema = commonSchema
	.extend({
		publishDate: z.coerce.date(),
		updateDate: z.coerce.date().optional(),
		emoji: z.string().optional(),
		category: z.enum(["tech", "idea", "private", "work"]).optional(),
		careerDate: optionalCareerDate,
		careerTitle: optionalCareerTitle,
	})
	.refine(
		(data) =>
			(data.careerDate === undefined) === (data.careerTitle === undefined),
		{
			message: "careerDateとcareerTitleはセットで指定してください",
			path: ["careerDate"],
		},
	);

const blogCollection = defineCollection({
	loader: glob({
		base: "./src/content/blog",
		pattern: contentPatterns(
			"./src/content/blog",
			process.env.NODE_ENV === "development",
		),
	}),
	schema: blogSchema,
});

const productCollection = defineCollection({
	loader: glob({
		base: "./src/content/product",
		pattern: contentPatterns(
			"./src/content/product",
			process.env.NODE_ENV === "development",
		),
	}),
	schema: commonSchema
		.extend({
			publishDate: z.coerce.date(),
			updateDate: z.coerce.date().optional(),
			thumbnail: z.string().nullable().optional(),
			carousel: z.array(z.string()).nullable().optional(),
		})
		.refine(
			(data) => {
				const hasThumbnail = data.thumbnail != null; // null と undefined 両方除外
				const hasCarousel = data.carousel != null && data.carousel.length > 0;
				return hasThumbnail !== hasCarousel; // XOR
			},
			{
				message: "thumbnail と carousel はどちらか一方のみ指定してください",
				path: ["thumbnail"],
			},
		),
});

// コレクションを保存
export const collections = {
	blog: blogCollection,
	product: productCollection,
};
