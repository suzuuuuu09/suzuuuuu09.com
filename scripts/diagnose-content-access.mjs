export async function diagnoseContentAccess(token, sha, request = fetch) {
	const repository = "suzuuuuu09/portfolio-content";
	const probes = [
		[
			"repository",
			`https://api.github.com/repos/${repository}`,
			`Bearer ${token}`,
		],
		[
			"commit",
			`https://api.github.com/repos/${repository}/git/commits/${sha}`,
			`Bearer ${token}`,
		],
		[
			"git",
			`https://github.com/${repository}.git/info/refs?service=git-upload-pack`,
			`Basic ${Buffer.from(`suzuuuuu09:${token}`).toString("base64")}`,
		],
	];
	const results = await Promise.all(
		probes.map(async ([name, url, authorization]) => {
			try {
				const response = await request(url, {
					headers: {
						Authorization: authorization,
						"User-Agent": "portfolio-content-diagnostic",
					},
					redirect: "manual",
					signal: AbortSignal.timeout(10000),
				});
				await response.body?.cancel();
				return [name, response.status];
			} catch {
				return [name, "request_failed"];
			}
		}),
	);
	return Object.fromEntries(results);
}
