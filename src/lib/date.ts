import dayjs from "dayjs";

export function getFormattedDate(date: string | Date) {
	const dayjsDate = dayjs(date);

	if (!dayjsDate.isValid()) {
		return undefined;
	}

	return {
		formattedDate: dayjsDate.format("YYYY.MM.DD"),
		dateTime: dayjsDate.toISOString(),
	};
}
