import assert from "node:assert/strict";
import test from "node:test";
import {
	formatContribution,
	parseContributions,
} from "../src/lib/contributions";

const response = {
	username: "suzuuuuu09",
	total: 3,
	weeks: [
		{
			days: [
				{ date: "2026-05-01", count: 1, level: 1 },
				{ date: "2026-05-02", count: 2, level: 2 },
			],
		},
		{ days: [{ date: "2026-05-03", count: 0, level: 0 }] },
	],
};

test("contribution text uses the actual weekday and singular only for one", () => {
	for (const [count, expected] of [
		[0, "No Contributions on Wed Nov 25 2026."],
		[1, "1 Contribution on Wed Nov 25 2026."],
		[2, "2 Contributions on Wed Nov 25 2026."],
	] as const) {
		assert.equal(
			formatContribution({ date: "2026-11-25", count, level: 0 }),
			expected,
		);
	}
});

test("partial weeks retain weekday positions and fill missing dates with null", () => {
	const data = parseContributions(response);
	assert.equal(data.username, response.username);
	assert.equal(data.total, 3);
	assert.deepEqual(data.weeks, [
		[null, null, null, null, null, ...response.weeks[0].days],
		[...response.weeks[1].days, null, null, null, null, null, null],
	]);
});

test("invalid upstream data cannot become cells or profile links", () => {
	for (const value of [
		null,
		{ ...response, username: "../bad" },
		{ ...response, total: -1 },
		{ ...response, weeks: [] },
		...[
			{ date: "2026-02-30", count: 0, level: 0 },
			{ date: "2026-05-01", count: -1, level: 0 },
			{ date: "2026-05-01", count: 0, level: 5 },
		].map((day) => ({ ...response, weeks: [{ days: [day] }] })),
		{
			...response,
			weeks: [{ days: [...response.weeks[0].days, ...response.weeks[0].days] }],
		},
		{
			...response,
			weeks: [
				{
					days: [
						{ date: "2026-05-01", count: 0, level: 0 },
						{ date: "2026-05-08", count: 0, level: 0 },
					],
				},
			],
		},
	]) {
		assert.throws(() => parseContributions(value), TypeError);
	}
});
