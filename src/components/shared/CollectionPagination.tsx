import { Pagination } from "@ark-ui/react/pagination";
import { css } from "styled-system/css";

export const ENTRIES_PER_PAGE = 10;

const paginationStyles = {
	root: css({
		display: "flex",
		justifyContent: "center",
		mt: { base: "8", md: "10" },
		w: "full",
	}),
	list: css({
		display: "flex",
		alignItems: "center",
		gap: { base: "1", md: "2" },
	}),
	item: css({
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		minW: "8",
		h: "8",
		px: "1",
		borderRadius: "md",
		color: "sz.text.sub",
		fontSize: "sm",
		transition: "color 0.2s, background-color 0.2s",
		_hover: {
			bg: "sz.bg-on/30",
			color: "sz.text.main",
		},
		_focusVisible: {
			outline: "2px solid",
			outlineColor: "sz.border",
			outlineOffset: "2px",
		},
		"&[data-selected]": {
			color: "sz.text.main",
			fontWeight: "bold",
		},
		"&[data-disabled]": {
			cursor: "not-allowed",
			opacity: "0.4",
		},
	}),
	ellipsis: css({
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		minW: "8",
		h: "8",
		color: "sz.text.sub",
		fontSize: "sm",
	}),
};

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
	return (
		<svg
			aria-hidden="true"
			fill="none"
			height="18"
			viewBox="0 0 24 24"
			width="18"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d={direction === "left" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"}
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="1.8"
			/>
		</svg>
	);
}

interface CollectionPaginationProps {
	basePath: string;
	firstPageHref?: string;
	count: number;
	label: string;
	page: number;
}

export default function CollectionPagination({
	basePath,
	firstPageHref = basePath,
	count,
	label,
	page,
}: CollectionPaginationProps) {
	const getPageHref = (targetPage: number) =>
		targetPage === 1 ? firstPageHref : `${basePath}${targetPage}/`;
	const totalPages = Math.ceil(count / ENTRIES_PER_PAGE);
	const rootLabel = `${label}のページ`;

	return (
		<Pagination.Root
			aria-label={rootLabel}
			className={paginationStyles.root}
			count={count}
			defaultPage={page}
			page={page}
			pageSize={ENTRIES_PER_PAGE}
			siblingCount={1}
			type="link"
			getPageUrl={({ page: targetPage }) => getPageHref(targetPage)}
			translations={{
				itemLabel: ({ page: itemPage, totalPages: itemTotalPages }) =>
					`${itemTotalPages}ページ中${itemPage}ページ目`,
				nextTriggerLabel: "次のページ",
				prevTriggerLabel: "前のページ",
				rootLabel,
			}}
		>
			<div className={paginationStyles.list}>
				<Pagination.PrevTrigger asChild className={paginationStyles.item}>
					<a
						aria-disabled={page === 1}
						href={page > 1 ? getPageHref(page - 1) : undefined}
					>
						<ChevronIcon direction="left" />
					</a>
				</Pagination.PrevTrigger>

				<Pagination.Context>
					{(pagination) =>
						pagination.pages.map((pageItem, index) =>
							pageItem.type === "page" ? (
								<Pagination.Item
									asChild
									className={paginationStyles.item}
									key={pageItem.value}
									{...pageItem}
								>
									<a href={getPageHref(pageItem.value)}>{pageItem.value}</a>
								</Pagination.Item>
							) : (
								<Pagination.Ellipsis
									className={paginationStyles.ellipsis}
									index={index}
									key={`ellipsis-${index}`}
								>
									…
								</Pagination.Ellipsis>
							),
						)
					}
				</Pagination.Context>

				<Pagination.NextTrigger asChild className={paginationStyles.item}>
					<a
						aria-disabled={page === totalPages}
						href={page < totalPages ? getPageHref(page + 1) : undefined}
					>
						<ChevronIcon direction="right" />
					</a>
				</Pagination.NextTrigger>
			</div>
		</Pagination.Root>
	);
}
