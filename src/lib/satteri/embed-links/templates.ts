import type { OgpData } from "./types";

function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

function safeHttpUrl(value: string, base?: string): string | undefined {
	try {
		const parsed = base ? new URL(value, base) : new URL(value);
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
			return undefined;
		}
		return parsed.href;
	} catch {
		return undefined;
	}
}

export function generateGoogleSlidesEmbedHtml(
	embedUrl: string,
	linkTitle: string,
): string {
	const safeEmbedUrl = safeHttpUrl(embedUrl);
	if (!safeEmbedUrl) return "";

	return `
<div class="google-slides-wrapper">
  <div class="google-slides-container">
    <iframe
      src="${escapeHtml(safeEmbedUrl)}"
      title="${escapeHtml(linkTitle || "Google Slides")}"
      frameborder="0"
      allowfullscreen="true"
      mozallowfullscreen="true"
      webkitallowfullscreen="true"
    ></iframe>
  </div>
</div>`;
}

export function generateGithubGistEmbedHtml(embedUrl: string): string {
	const cleanUrl = embedUrl.split("?")[0];
	const scriptUrl = cleanUrl.endsWith(".js") ? cleanUrl : `${cleanUrl}.js`;
	const safeScriptUrl = safeHttpUrl(scriptUrl);
	if (!safeScriptUrl) return "";

	return `
<div class="github-gist-embed-container">
  <script src="${escapeHtml(safeScriptUrl)}"></script>
</div>`;
}

export function generateCodepenEmbedHtml(slugHash: string): string {
	return `
  <div class="codepen-embed-container">
    <p
      class="codepen"
      data-height="300"
      data-default-tab="html,result"
      data-slug-hash="${slugHash}"
      style="height: 300px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;"
    >
    </p>
    <script async src="https://public.codepenassets.com/embed/index.js"></script>
  </div>`;
}

export function generateNoteEmbedHtml(embedUrl: string): string {
	const safeEmbedUrl = safeHttpUrl(embedUrl);
	if (!safeEmbedUrl) return "";

	return `
    <iframe class="note-embed" src="${escapeHtml(safeEmbedUrl)}" style="border: 0; display: block; max-width: 99%; width: 494px; padding: 0px; margin: 10px 0px; position: static; visibility: visible;" height="400"></iframe>
    <script async src="https://note.com/scripts/embed.js" charset="utf-8"></script>
  `;
}

export function generateTwitterEmbedHtml(url: string, tweetId: string): string {
	const escapedUrl = escapeHtml(url);
	const escapedTweetId = escapeHtml(tweetId);

	return `
<div class="twitter-embed-container" hidden>
  <div
    data-twitter-embed
    data-twitter-tweet-id="${escapedTweetId}"
    data-twitter-url="${escapedUrl}"
    style="width: 100%; max-width: 550px; margin: 0 auto;"
  >
  </div>
</div>`;
}

export function generateCardHtml(
	url: string,
	ogpData: OgpData,
	linkTitle: string,
	typeClass: string,
): string {
	const title = ogpData.title || linkTitle || url;
	const site = ogpData.site_name || "";
	const description = ogpData.description || "";
	const safeLinkUrl = safeHttpUrl(url) || "#";

	// URL解決 (相対パス対応)
	const resolveUrl = (path?: string) => {
		if (!path) return undefined;
		return safeHttpUrl(path, url);
	};

	const absoluteImageUrl = resolveUrl(ogpData.image);
	const absoluteFaviconUrl = resolveUrl(ogpData.favicon);

	const hasImage = Boolean(absoluteImageUrl);
	const imageHtml = hasImage
		? `<div class="link-card-image"><img src="${escapeHtml(absoluteImageUrl ?? "")}" alt="${escapeHtml(title)}" loading="lazy" onload="this.naturalWidth >= this.naturalHeight * 4 ? this.closest('.link-card')?.classList.add('wide-image') : ''" /></div>`
		: `<div class="link-card-image"><div class="no-image"></div></div>`;

	// グリッド表示用のクラス付与ロジック（必要に応じて調整）
	const imageRatioClass = hasImage
		? "link-card-with-image"
		: "link-card-no-image";

	const faviconHtml = absoluteFaviconUrl
		? `<img src="${escapeHtml(absoluteFaviconUrl)}" alt="${escapeHtml(site)} favicon" class="link-card-favicon" loading="lazy" />`
		: `<svg class="link-card-favicon-fallback" stroke-width="0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="32" d="M256 48C141.13 48 48 141.13 48 256s93.13 208 208 208 208-93.13 208-208S370.87 48 256 48Z"></path><path fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="32" d="M256 48c-58.07 0-112.67 93.13-112.67 208S197.93 464 256 464s112.67-93.13 112.67-208S314.07 48 256 48Z"></path><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M117.33 117.33c38.24 27.15 86.38 43.34 138.67 43.34s100.43-16.19 138.67-43.34M394.67 394.67c-38.24-27.15-86.38-43.34-138.67-43.34s-100.43 16.19-138.67 43.34"></path><path fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="32" d="M256 48 256 464"></path><path fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="32" d="M464 256 48 256"></path></svg>`;

	const descriptionHtml = description
		? `<span class="link-card-description">${escapeHtml(description)}</span>`
		: "";

	// グリッドレイアウトか通常かによってHTML構造が多少異なる場合、ここで分岐または統一
	// 今回は統一的な構造として返却
	return `<div class="link-card ${escapeHtml(typeClass)} link-card-grid ${imageRatioClass}">
    <a href="${escapeHtml(safeLinkUrl)}" target="_blank" rel="noopener noreferrer">
      <div class="link-card-grid-container">
        ${imageHtml}
        <div class="link-card-content">
          <span class="link-card-title">${escapeHtml(title)}</span>
          ${descriptionHtml}
          <div class="link-card-site-wrapper">
            ${faviconHtml}
            <span class="link-card-site">${escapeHtml(site)}</span>
          </div>
        </div>
      </div>
    </a>
  </div>`;
}
