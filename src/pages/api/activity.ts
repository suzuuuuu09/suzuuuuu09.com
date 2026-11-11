import type { APIRoute } from "astro";
import { parseContributions } from "@/lib/contributions";

export const prerender = false;

export const GET: APIRoute = async () => {
	try {
		const response = await fetch("https://api.suzuuuuu09.com/contrib", {
			signal: AbortSignal.timeout(10_000),
		});
		if (!response.ok) throw new Error("Contribution API unavailable");
		return Response.json(parseContributions(await response.json()), {
			headers: { "Cache-Control": "public, max-age=3600" },
		});
	} catch {
		return Response.json(
			{ error: "活動データを取得できませんでした。" },
			{
				status: 502,
				headers: { "Cache-Control": "no-store" },
			},
		);
	}
};
