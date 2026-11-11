// https://github.com/nasubi-dev/portfoilo-v2/blob/main/src/utils/cleanAssetPath.ts

/**
 * Obsidian形式の画像パス（![[image.webp]]）を通常のパス（image.webp）に変換する
 */
export const cleanAssetPath = (imagePath: string): string => {
	return imagePath.replaceAll("![[", "").replaceAll("]]", "");
};
