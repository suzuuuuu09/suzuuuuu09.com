import { handle } from "@astrojs/cloudflare/handler";
import {
	type AssetFetcher,
	isContentPage,
	negotiateMarkdown,
	staticAssetRequest,
} from "./lib/markdown-negotiation";

type HandlerParameters = Parameters<typeof handle>;

export default {
	async fetch(
		request: Request,
		env: HandlerParameters[1],
		context: HandlerParameters[2],
	): Promise<Response> {
		const assets = (env as unknown as { ASSETS: AssetFetcher }).ASSETS;
		const { pathname } = new URL(request.url);

		if (
			(request.method === "GET" || request.method === "HEAD") &&
			isContentPage(pathname)
		) {
			const asset = await assets.fetch(staticAssetRequest(request));
			if (asset.status !== 404) {
				return negotiateMarkdown(request, asset, assets);
			}
			await asset.body?.cancel();
		}

		const response = await handle(request, env, context);
		return negotiateMarkdown(request, response, assets);
	},
};
