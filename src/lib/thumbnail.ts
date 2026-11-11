import { R2_URL } from "@/consts/base";
import { cleanAssetPath } from "@/utils/cleanAssetPath";

/**
 * @param pathInput - Obsidianのアッセットパス
 * @returns サムネイルURL
 * - もしURLが直接指定されている場合はそのまま返す
 * - もしアッセットパスが指定されている場合はR2_URLを基にURLを構築する
 * - もしファイル名のみが指定されている場合は、assetsディレクトリ内のファイルとしてURLを構築する
 * - それ以外の場合は、入力されたパスをそのまま返す
 */
export const buildThumbnailUrl = (pathInput: string) => {
	if (!pathInput) return "";

	// アッセットパスをクリーンアップしてから処理する
	const path = cleanAssetPath(pathInput);

	// URLが直接指定されている場合はそのまま返す
	if (path.startsWith("http://") || path.startsWith("https://")) return path;
	if (path.startsWith("assets/")) return `${R2_URL}/${path}`;
	if (/\.(jpe?g|png|gif|webp|avif|svg)$/i.test(path) && !path.includes("/")) {
		return `${R2_URL}/assets/${path}`;
	}
	return path;
};
