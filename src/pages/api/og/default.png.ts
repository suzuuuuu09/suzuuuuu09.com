import type { APIRoute } from "astro";
import { generateOgImage } from "../../../components/features/og/OgImage";

export const GET: APIRoute = async () => {
	const image = await generateOgImage("suzuuuuu09.com", false);
	return new Response(new Uint8Array(image), {
		headers: { "Content-Type": "image/png" },
	});
};
