import { defineGlobalStyles } from "@pandacss/dev";

export const zoomImageStyles = defineGlobalStyles({
	// medium-zoomのオーバーレイと拡大画像のz-indexを高く設定
	".medium-zoom-overlay": { zIndex: 9998 },
	".medium-zoom-image--opened": { zIndex: 9999 },
});
