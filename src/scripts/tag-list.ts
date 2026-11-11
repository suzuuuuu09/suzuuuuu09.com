import { getMaxVisibleTags } from "@/utils/tag";

const animationFrames = new WeakMap<HTMLElement, number>();
const updates = new WeakMap<HTMLElement, () => void>();

function getOverflowWidth(
	overflow: HTMLElement,
	label: HTMLElement | null,
	remainingTags: number,
): number {
	if (!label) return overflow.getBoundingClientRect().width;

	const previousLabel = label.textContent;
	label.textContent = `+${remainingTags}`;
	const width = overflow.getBoundingClientRect().width;
	label.textContent = previousLabel;

	return width;
}

function getAvailableWidth(list: HTMLElement): number {
	const link = list.closest("a");
	let ancestor = list.parentElement;

	while (ancestor && ancestor !== link) {
		const styles = getComputedStyle(ancestor);
		const horizontalPadding =
			Number.parseFloat(styles.paddingLeft) +
			Number.parseFloat(styles.paddingRight);

		if (horizontalPadding > 0 && link) {
			return Math.max(
				0,
				link.getBoundingClientRect().width - horizontalPadding,
			);
		}

		ancestor = ancestor.parentElement;
	}

	return list.getBoundingClientRect().width;
}

function updateTagList(list: HTMLElement): void {
	const items = Array.from(
		list.querySelectorAll<HTMLElement>("[data-tag-item]"),
	);
	const overflow = list.querySelector<HTMLElement>("[data-tag-overflow]");

	if (items.length === 0) return;

	const overflowLabel = overflow?.querySelector<HTMLElement>("p") ?? null;
	const previousVisibility = list.style.visibility;
	const previousWidth = list.style.width;
	const containerWidth = getAvailableWidth(list);

	list.style.visibility = "hidden";
	list.style.flexWrap = "nowrap";
	list.style.width = `${containerWidth}px`;
	items.forEach((item) => {
		item.hidden = false;
	});
	if (overflow) overflow.hidden = false;

	const widths = items.map((item) => item.getBoundingClientRect().width);
	const styles = getComputedStyle(list);
	const gap = Number.parseFloat(styles.columnGap) || 0;
	const maxVisibleTags = getMaxVisibleTags(
		widths,
		containerWidth,
		gap,
		(remainingTags) =>
			overflow ? getOverflowWidth(overflow, overflowLabel, remainingTags) : 0,
	);

	items.forEach((item, index) => {
		item.hidden = index >= maxVisibleTags;
	});

	const remainingTags = items.length - maxVisibleTags;
	if (overflow) {
		overflow.hidden = remainingTags === 0;
		if (overflowLabel && remainingTags > 0) {
			overflowLabel.textContent = `+${remainingTags}`;
		}
	}

	list.dataset.visibleTags = String(maxVisibleTags);
	list.style.visibility = previousVisibility;
	list.style.width = previousWidth;
}

function scheduleTagListUpdate(list: HTMLElement): void {
	const previousFrame = animationFrames.get(list);
	if (previousFrame !== undefined) cancelAnimationFrame(previousFrame);

	const frame = requestAnimationFrame(() => {
		const settledFrame = requestAnimationFrame(() => {
			animationFrames.delete(list);
			updateTagList(list);
		});
		animationFrames.set(list, settledFrame);
	});
	animationFrames.set(list, frame);
}

function setupTagList(list: HTMLElement): void {
	const existingUpdate = updates.get(list);
	if (existingUpdate) {
		existingUpdate();
		return;
	}

	const scheduleUpdate = () => scheduleTagListUpdate(list);
	updates.set(list, scheduleUpdate);

	if (typeof ResizeObserver !== "undefined") {
		const observer = new ResizeObserver(scheduleUpdate);
		observer.observe(list);
	}

	updateTagList(list);
	if (document.fonts) {
		void document.fonts.ready.then(() => scheduleTagListUpdate(list));
	}
}

export function setupTagLists(): void {
	document
		.querySelectorAll<HTMLElement>("[data-tag-list]")
		.forEach(setupTagList);
}
