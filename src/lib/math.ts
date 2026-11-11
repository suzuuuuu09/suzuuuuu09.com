export function containsMath(markdown: string): boolean {
	const bodyWithoutCode = markdown
		.replace(/```[\s\S]*?```/g, "")
		.replace(/~~~[\s\S]*?~~~/g, "")
		.replace(/`[^`\n]*`/g, "");

	return (
		/\\(?:\(|\[|begin\{)/.test(bodyWithoutCode) ||
		/\$\$[\s\S]+?\$\$/.test(bodyWithoutCode) ||
		/(^|[^\\])\$(?!\$)[^$\n]+\$(?!\$)/m.test(bodyWithoutCode)
	);
}
