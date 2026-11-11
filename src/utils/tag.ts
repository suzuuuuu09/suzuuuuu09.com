export function getMaxVisibleTags(
	tagWidths: readonly number[],
	containerWidth: number,
	gap: number,
	getOverflowWidth: (remainingTags: number) => number,
): number {
	if (tagWidths.length === 0) return 0;

	let totalTagWidth = 0;
	let maxVisibleTags = 1;

	for (let visibleTags = 1; visibleTags <= tagWidths.length; visibleTags++) {
		totalTagWidth += tagWidths[visibleTags - 1];

		const remainingTags = tagWidths.length - visibleTags;
		const overflowWidth =
			remainingTags > 0 ? getOverflowWidth(remainingTags) : 0;
		const itemCount = visibleTags + (remainingTags > 0 ? 1 : 0);
		const totalWidth =
			totalTagWidth + overflowWidth + Math.max(0, itemCount - 1) * gap;

		if (totalWidth <= containerWidth) {
			maxVisibleTags = visibleTags;
		}
	}

	return maxVisibleTags;
}
