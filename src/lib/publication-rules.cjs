const blogCategories = new Set(["tech", "idea", "private", "work"]);

function getRequiredFrontmatterIssues(frontmatter) {
	const issues = [];

	if (
		typeof frontmatter.title !== "string" ||
		frontmatter.title.trim() === ""
	) {
		issues.push({
			code: "frontmatter.title.missing",
			message: "titleが設定されていません",
		});
	}

	if (typeof frontmatter.slug !== "string" || frontmatter.slug.trim() === "") {
		issues.push({
			code: "frontmatter.slug.missing",
			message: "slugが設定されていません",
		});
	}

	return issues;
}

function isDateValue(value) {
	if (value instanceof Date) return !Number.isNaN(value.getTime());
	if (typeof value !== "string" && typeof value !== "number") return false;
	if (typeof value === "string" && value.trim() === "") return false;

	return !Number.isNaN(new Date(value).getTime());
}

function hasOptionalDateValue(value) {
	return !(
		value === undefined ||
		value === null ||
		(typeof value === "string" && value.trim() === "")
	);
}

function getOptionalDateIssues(frontmatter, fields) {
	return fields.flatMap(([field, code]) => {
		const value = frontmatter[field];
		return hasOptionalDateValue(value) && !isDateValue(value)
			? [{ code, message: field + "が有効な日付ではありません" }]
			: [];
	});
}

function getCollectionFrontmatterIssues(collection, frontmatter) {
	const issues = getRequiredFrontmatterIssues(frontmatter);

	const tags = frontmatter.tags;
	if (
		tags !== undefined &&
		tags !== null &&
		(!Array.isArray(tags) || tags.some((tag) => typeof tag !== "string"))
	) {
		issues.push({
			code: "frontmatter.tags.invalid",
			message: "tagsは文字列配列で指定してください",
		});
	}

	const description = frontmatter.description;
	if (
		description !== undefined &&
		description !== null &&
		typeof description !== "string"
	) {
		issues.push({
			code: "frontmatter.description.invalid",
			message: "descriptionは文字列またはnullで指定してください",
		});
	}

	const isPublish = frontmatter.isPublish;
	if (isPublish !== undefined && typeof isPublish !== "boolean") {
		issues.push({
			code: "frontmatter.is-publish.invalid",
			message: "isPublishは真偽値で指定してください",
		});
	}

	if (collection === "blog") {
		const category = frontmatter.category;
		if (
			category !== undefined &&
			(typeof category !== "string" || !blogCategories.has(category))
		) {
			issues.push({
				code: "blog.category.invalid",
				message:
					"categoryが不正です。tech、idea、private、workのいずれかを指定してください",
			});
		}
		issues.push(
			...getOptionalDateIssues(frontmatter, [
				["publishDate", "blog.publish-date.invalid"],
				["updateDate", "blog.update-date.invalid"],
			]),
		);

		const careerDate = frontmatter.careerDate;
		const careerTitle = frontmatter.careerTitle;
		const hasCareerDate = hasOptionalDateValue(careerDate);
		const hasCareerTitle =
			careerTitle !== undefined &&
			careerTitle !== null &&
			!(typeof careerTitle === "string" && careerTitle.trim() === "");
		if (hasCareerDate || hasCareerTitle) {
			if (
				!isDateValue(careerDate) ||
				typeof careerTitle !== "string" ||
				careerTitle.trim() === ""
			) {
				issues.push({
					code: "blog.career.invalid",
					message:
						"careerDateとcareerTitleには有効な日付と空でない表示名をセットで指定してください",
				});
			}
		}
	}

	if (collection === "product") {
		const thumbnail = frontmatter.thumbnail;
		const carousel = frontmatter.carousel;
		if (
			thumbnail !== undefined &&
			thumbnail !== null &&
			typeof thumbnail !== "string"
		) {
			issues.push({
				code: "product.media-source.invalid",
				message: "thumbnailは文字列で指定してください",
			});
		}
		if (
			carousel !== undefined &&
			carousel !== null &&
			(!Array.isArray(carousel) ||
				carousel.some((item) => typeof item !== "string"))
		) {
			issues.push({
				code: "product.carousel.invalid",
				message: "carouselは文字列配列で指定してください",
			});
		}
		if (hasProductMediaConflict(frontmatter)) {
			issues.push({
				code: "product.media-source.invalid",
				message:
					"thumbnailまたは空でないcarouselのどちらか一方を指定してください",
			});
		}
		issues.push(
			...getOptionalDateIssues(frontmatter, [
				["publishDate", "product.publish-date.invalid"],
				["updateDate", "product.update-date.invalid"],
			]),
		);
	}

	return issues;
}

function normalizeSlug(value, { stripMarkdownExtension = false } = {}) {
	const normalize = (text) => {
		const normalized = text.trim().replace(/^\/+/, "");
		return (
			stripMarkdownExtension ? normalized.replace(/\.md$/i, "") : normalized
		).toLocaleLowerCase();
	};

	try {
		return normalize(decodeURIComponent(String(value)));
	} catch {
		return normalize(String(value));
	}
}

function hasDuplicateSlug({
	collection,
	filePath,
	slug,
	entries,
	stripMarkdownExtension = false,
}) {
	if (typeof slug !== "string" || slug.trim() === "") return false;

	const normalizedSlug = normalizeSlug(slug, { stripMarkdownExtension });
	return entries.some(
		(entry) =>
			entry.collection === collection &&
			entry.filePath !== filePath &&
			typeof entry.slug === "string" &&
			entry.slug.trim() !== "" &&
			normalizeSlug(entry.slug, { stripMarkdownExtension }) === normalizedSlug,
	);
}

function hasProductMediaConflict(frontmatter) {
	const hasThumbnail = frontmatter.thumbnail != null;
	const hasCarousel =
		Array.isArray(frontmatter.carousel) && frontmatter.carousel.length > 0;

	return hasThumbnail === hasCarousel;
}

module.exports = {
	getCollectionFrontmatterIssues,
	getRequiredFrontmatterIssues,
	hasDuplicateSlug,
	hasProductMediaConflict,
	normalizeSlug,
};
