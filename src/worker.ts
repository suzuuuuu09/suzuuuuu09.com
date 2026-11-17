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
		const isStaticPageRequest =
			(request.method === "GET" || request.method === "HEAD") &&
			isContentPage(pathname);

		let response = isStaticPageRequest
			? await assets.fetch(staticAssetRequest(request))
			: await handle(request, env, context);
		if (isStaticPageRequest && response.status === 404) {
			await response.body?.cancel();
			response = await handle(request, env, context);
		}

		return negotiateMarkdown(request, response, assets);
	},
};
