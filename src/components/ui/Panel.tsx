import { ReactNode } from "react";
import { css, sva } from "styled-system/css";

interface PanelProps {
	title: string;
	children?: ReactNode;
	visible?: "lg" | "base" | "always";
	collapsibleOnMobile?: boolean;
}

const panelStyles = sva({
	slots: ["root", "title"],
	base: {
		root: {
			w: "full",
			bg: "sz.bg-on.500",
			borderRadius: "xl",
			px: "4",
			py: "6",
			shadow: "sm",
			borderWidth: "1px",
			borderColor: "sz.border/20",
		},
		title: {
			fontSize: "lg",
			fontWeight: "bold",
			color: "sz.text.main",
			mb: "4",
			px: "2",
		},
	},
	variants: {
		visible: {
			lg: {
				root: {
					display: { base: "none", _lg: "block" },
				},
			},
			base: {
				root: {
					display: { base: "block", _lg: "none" },
				},
			},
			always: {
				root: {
					display: "block",
				},
			},
		},
	},
});

export default function Panel(props: PanelProps) {
	const { title, children, visible = "always" } = props;
	const { collapsibleOnMobile = false } = props;
	const styles = panelStyles({ visible });
	const collapsibleTitleClass = css({
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		cursor: { base: "pointer", lg: "default" },
		pointerEvents: { base: "auto", lg: "none" },
		listStyleType: "none",
		mb: "4",
		_focusVisible: {
			outline: "2px solid",
			outlineColor: "sz.primary",
			outlineOffset: "2px",
		},
		_hover: {
			color: "sz.primary",
		},
		_active: {
			transform: "translateY(1px)",
		},
		transition:
			"color var(--durations-fast) var(--easings-out), transform var(--durations-faster) var(--easings-out)",
		"&::marker": {
			display: "none",
		},
		"&::-webkit-details-marker": {
			display: "none",
		},
	});
	const collapsibleContentClass = css({
		_lg: {
			display: "block",
		},
	});

	if (collapsibleOnMobile) {
		return (
			<details className={styles.root} data-collapsible-panel open>
				<summary className={collapsibleTitleClass}>
					<span
						className={`${styles.title} ${css({ mb: "0" })}`}
						role="heading"
						aria-level={2}
					>
						{title}
					</span>
					<span
						className={css({
							display: { base: "inline", lg: "none" },
							fontSize: "xl",
							lineHeight: "1",
							color: "sz.text.sub",
						})}
						aria-hidden="true"
					>
						⌄
					</span>
				</summary>
				<div className={collapsibleContentClass}>{children}</div>
			</details>
		);
	}

	return (
		<section className={styles.root}>
			<h2 className={styles.title}>{title}</h2>
			{children}
		</section>
	);
}
