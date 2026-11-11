import { Portal } from "@ark-ui/react/portal";
import { Tooltip } from "@ark-ui/react/tooltip";
import {
	type KeyboardEvent,
	type ReactNode,
	useEffect,
	useRef,
	useState,
} from "react";
import { css, cx } from "styled-system/css";
import {
	type ContributionDay,
	type Contributions,
	formatContribution,
} from "@/lib/contributions";

const colors = [
	css({
		"--activity-color": "#e7e4ee",
		"--activity-text": "#474554",
		_dark: { "--activity-color": "#332e40", "--activity-text": "#e8e6f0" },
	}),
	css({
		"--activity-color": "#cbd2fc",
		"--activity-text": "#474554",
		_dark: { "--activity-color": "#343b70", "--activity-text": "#e8e6f0" },
	}),
	css({
		"--activity-color": "#94a4f6",
		"--activity-text": "#1a1625",
		_dark: { "--activity-color": "#485ab4", "--activity-text": "#e8e6f0" },
	}),
	css({
		"--activity-color": "#617afc",
		"--activity-text": "#1a1625",
	}),
	css({
		"--activity-color": "#3951e2",
		"--activity-text": "#ffffff",
		_dark: { "--activity-color": "#93a4ff", "--activity-text": "#1a1625" },
	}),
];
const cellClass = css({
	bg: "var(--activity-color)",
	color: "var(--activity-text)",
	aspectRatio: "1",
	w: "full",
	p: "0",
	borderRadius: "2px",
	fontFamily: "var(--moralerspace-neon)",
	fontSize: "11px",
	fontWeight: "bold",
	lineHeight: "1",
	"&[data-date]": { cursor: "pointer" },
	"&[data-date]:hover, &[data-date]:focus-visible, &[data-current][data-state='open']":
		{
			outline: "2px solid",
			outlineColor: "sz.text.main",
			outlineOffset: "1px",
		},
});

export default function ContributionMap({ children }: { children: ReactNode }) {
	const [data, setData] = useState<Contributions | null>(null);
	const [error, setError] = useState(false);
	const [attempt, setAttempt] = useState(0);
	const [activeDay, setActiveDay] = useState<ContributionDay | null>(null);
	const [open, setOpen] = useState(false);
	const [focusedDate, setFocusedDate] = useState("");
	const scroller = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const controller = new AbortController();
		setError(false);
		fetch("/api/activity", { signal: controller.signal })
			.then(async (response) => {
				if (!response.ok) throw new Error("Activity unavailable");
				const result: Contributions = await response.json();
				if (controller.signal.aborted) return;
				setData(result);
				setFocusedDate(result.weeks.flat().findLast((day) => day)?.date ?? "");
			})
			.catch(() => {
				if (!controller.signal.aborted) setError(true);
			});
		return () => controller.abort();
	}, [attempt]);

	useEffect(() => {
		if (data && scroller.current)
			scroller.current.scrollLeft = scroller.current.scrollWidth;
	}, [data]);

	const moveFocus = (event: KeyboardEvent<HTMLDivElement>) => {
		const offset = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -7, ArrowRight: 7 }[
			event.key
		];
		if (!offset || !(event.target instanceof HTMLButtonElement) || !data)
			return;
		event.preventDefault();
		const cells = data.weeks.flat();
		let index = Number(event.target.dataset.index) + offset;
		while (index >= 0 && index < cells.length && !cells[index]) index += offset;
		if (cells[index])
			event.currentTarget
				.querySelector<HTMLButtonElement>(`[data-index="${index}"]`)
				?.focus();
	};

	return (
		<div
			className={css({
				color: "sz.text.main",
				minW: "0",
				w: "full",
			})}
		>
			<div
				className={css({
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					flexWrap: "wrap",
					gap: "4",
					mb: "6",
					_sm: { flexDir: "column", alignItems: "start" },
				})}
			>
				<a
					href={`https://github.com/${data?.username ?? "suzuuuuu09"}`}
					target="_blank"
					rel="noopener noreferrer"
					className={css({
						display: "inline-flex",
						alignItems: "center",
						gap: "3",
						color: "sz.text.main",
						fontWeight: "bold",
						fontSize: "xl",
						textDecoration: "none",
						_hover: { textDecoration: "none" },
						_focusVisible: {
							outline: "2px solid",
							outlineColor: "sz.primary",
							outlineOffset: "4px",
							borderRadius: "sm",
						},
					})}
				>
					{children}
					{data?.username ?? "suzuuuuu09"}
				</a>
				{data && (
					<p>
						<strong>{data.total.toLocaleString("en-US")}</strong> contributions
					</p>
				)}
			</div>
			{!data ? (
				<div
					role="status"
					className={css({
						minH: "40",
						display: "flex",
						alignItems: "center",
						gap: "3",
						color: "sz.text.sub",
					})}
				>
					{error
						? "活動データを取得できませんでした。"
						: "活動データを読み込み中…"}
					{error && (
						<button
							type="button"
							onClick={() => setAttempt(attempt + 1)}
							className={css({
								color: "sz.primary",
								textDecoration: "underline",
								cursor: "pointer",
							})}
						>
							再試行
						</button>
					)}
				</div>
			) : (
				<Tooltip.Root
					open={open}
					triggerValue={activeDay?.date ?? null}
					onOpenChange={({ open }) => setOpen(open)}
					onTriggerValueChange={({ value }) =>
						setActiveDay(
							data.weeks.flat().find((day) => day?.date === value) ?? null,
						)
					}
					openDelay={150}
					closeDelay={0}
					closeOnClick={false}
					closeOnPointerDown={false}
					interactive
					lazyMount
					unmountOnExit
					positioning={{
						placement: "right",
						flip: ["left"],
						gutter: 10,
						overflowPadding: 8,
						strategy: "fixed",
					}}
				>
					<div
						ref={scroller}
						onScroll={() => setOpen(false)}
						className={css({
							overflowX: "auto",
							py: "1",
							px: "1",
							overscrollBehaviorX: "contain",
						})}
					>
						<div
							onKeyDown={moveFocus}
							aria-label="GitHubの日別コントリビューション。矢印キーで日付を移動できます。"
							role="group"
							className={css({
								display: "grid",
								gridAutoFlow: "column",
								gridTemplateRows: "repeat(7, auto)",
								gridAutoColumns: "minmax(var(--activity-cell-min), 1fr)",
								gap: "3px",
								"--activity-cell-min": "20px",
								_sm: { "--activity-cell-min": "18px" },
							})}
							style={{
								minWidth: `calc(${data.weeks.length} * var(--activity-cell-min) + ${(data.weeks.length - 1) * 3}px)`,
							}}
						>
							{data.weeks.flat().map((day, index) =>
								day ? (
									<Tooltip.Trigger
										key={day.date}
										value={day.date}
										type="button"
										data-date={day.date}
										data-index={index}
										tabIndex={focusedDate === day.date ? 0 : -1}
										onFocus={() => setFocusedDate(day.date)}
										onClick={() => {
											setActiveDay(day);
											setOpen(true);
										}}
										aria-label={formatContribution(day)}
										className={cx(cellClass, colors[day.level])}
									>
										{day.date.endsWith("-01")
											? Number(day.date.slice(5, 7))
											: null}
									</Tooltip.Trigger>
								) : (
									<span
										key={`empty-${index}`}
										aria-hidden="true"
										data-empty=""
										onPointerEnter={() => setOpen(false)}
										className={cx(cellClass, colors[0])}
										style={{ opacity: 0.5 }}
									/>
								),
							)}
						</div>
					</div>
					<Portal>
						<Tooltip.Positioner>
							<Tooltip.Content
								className={cx(
									css({
										zIndex: "50",
										bg: "sz.bg-on.500",
										color: "sz.text.main",
										border: "2px solid",
										borderColor: "var(--activity-color)",
										borderRadius: "lg",
										px: "3",
										py: "2",
										fontSize: "xs",
										fontWeight: "bold",
										lineHeight: "1.5",
										shadow: "md",
										maxW: "64",
									}),
									colors[activeDay?.level ?? 0],
								)}
							>
								<Tooltip.Arrow
									className={css({
										"--arrow-size": "8px",
										"--arrow-background": "{colors.sz.bg-on.500}",
									})}
								>
									<Tooltip.ArrowTip
										className={css({
											borderTop: "2px solid var(--activity-color)",
											borderLeft: "2px solid var(--activity-color)",
										})}
									/>
								</Tooltip.Arrow>
								{activeDay && (
									<time dateTime={activeDay.date}>
										{formatContribution(activeDay)}
									</time>
								)}
							</Tooltip.Content>
						</Tooltip.Positioner>
					</Portal>
				</Tooltip.Root>
			)}
			<div
				className={css({
					display: "flex",
					alignItems: "center",
					gap: "2",
					mt: "5",
					fontSize: "xs",
					color: "sz.text.sub",
					_sm: { justifyContent: "center" },
				})}
				role="group"
				aria-label="コントリビューション数の凡例"
			>
				<span>Less</span>
				{colors.map((color) => (
					<span
						key={color}
						aria-hidden="true"
						className={cx(
							css({
								w: "4",
								h: "4",
								borderRadius: "2px",
								bg: "var(--activity-color)",
							}),
							color,
						)}
					/>
				))}
				<span>More</span>
			</div>
		</div>
	);
}
