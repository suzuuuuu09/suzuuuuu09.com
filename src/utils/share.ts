export function buildTwitterShareUrl(title: string, url: string) {
	const twitterBaseUrl = "https://twitter.com/intent/tweet";
	const params = new URLSearchParams({
		text: title,
		url,
	});
	return `${twitterBaseUrl}?${params.toString()}`;
}
