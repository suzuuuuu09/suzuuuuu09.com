export const SITE_TITLE = "suzuuuuu09.com";
export const SITE_DESCRIPTION = "Welcome to suzuuuuu09.com!";
export const HOME_SECTION_ENTRY_LIMIT = 6;

const DEFAULT_R2_URL = "https://content.suzuuuuu09.com";

// dotenvx can expose an encrypted placeholder when a private key is not
// available during a static build. Never emit that value as a browser URL.
const configuredR2Url = process.env.PUBLIC_R2_URL?.trim();
let parsedR2Url: URL | undefined;

if (configuredR2Url) {
	try {
		const url = new URL(configuredR2Url);
		if (url.protocol === "https:" && url.hostname) {
			parsedR2Url = url;
		}
	} catch {
		// Fall back to the known HTTPS origin below.
	}
}

export const R2_URL = (parsedR2Url?.toString() ?? DEFAULT_R2_URL).replace(
	/\/$/,
	"",
);

// Do not render an analytics tag when dotenvx supplied an encrypted placeholder.
const configuredGaTrackingId = process.env.PUBLIC_GA_TRACKING_ID?.trim();
export const GA_TRACKING_ID =
	process.env.DISABLE_GA_TRACKING !== "1" &&
	configuredGaTrackingId &&
	!configuredGaTrackingId.startsWith("encrypted:")
		? configuredGaTrackingId
		: "";

if (
	process.env.SITE_PRODUCTION_BUILD === "1" &&
	process.env.DISABLE_GA_TRACKING !== "1" &&
	!GA_TRACKING_ID
) {
	throw new Error(
		"Production builds require a decrypted PUBLIC_GA_TRACKING_ID. Configure it in the build environment or provide the dotenvx decryption key.",
	);
}
