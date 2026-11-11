export interface ContributionDay {
	date: string;
	count: number;
	level: number;
}

export interface Contributions {
	username: string;
	total: number;
	weeks: (ContributionDay | null)[][];
}

export function formatContribution(day: ContributionDay): string {
	const date = new Date(`${day.date}T00:00:00Z`)
		.toLocaleDateString("en-US", {
			weekday: "short",
			month: "short",
			day: "numeric",
			year: "numeric",
			timeZone: "UTC",
		})
		.replaceAll(",", "");
	return `${day.count === 0 ? "No" : day.count} Contribution${day.count === 1 ? "" : "s"} on ${date}.`;
}

export function parseContributions(value: unknown): Contributions {
	const data = value as {
		username: string;
		total: number;
		weeks: { days: ContributionDay[] }[];
	};
	const invalid = () => new TypeError("Invalid contribution data");
	if (
		!data ||
		typeof data.username !== "string" ||
		!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(data.username) ||
		!Number.isSafeInteger(data.total) ||
		data.total < 0 ||
		!Array.isArray(data.weeks) ||
		data.weeks.length < 1 ||
		data.weeks.length > 54
	)
		throw invalid();

	let previousDate = "";
	const weeks = data.weeks.map((week) => {
		if (
			!week ||
			!Array.isArray(week.days) ||
			!week.days.length ||
			week.days.length > 7
		)
			throw invalid();
		const cells: (ContributionDay | null)[] = Array(7).fill(null);
		let weekStart: number | undefined;
		for (const day of week.days) {
			if (
				!day ||
				typeof day.date !== "string" ||
				!/^\d{4}-\d{2}-\d{2}$/.test(day.date) ||
				!Number.isSafeInteger(day.count) ||
				day.count < 0 ||
				!Number.isInteger(day.level) ||
				day.level < 0 ||
				day.level > 4
			)
				throw invalid();
			const date = new Date(`${day.date}T00:00:00Z`);
			if (
				!Number.isFinite(date.getTime()) ||
				date.toISOString().slice(0, 10) !== day.date ||
				day.date <= previousDate
			)
				throw invalid();
			const weekday = date.getUTCDay();
			const start = date.getTime() - weekday * 86_400_000;
			if (weekStart !== undefined && weekStart !== start) throw invalid();
			weekStart = start;
			previousDate = day.date;
			cells[weekday] = { date: day.date, count: day.count, level: day.level };
		}
		return cells;
	});
	return { username: data.username, total: data.total, weeks };
}
