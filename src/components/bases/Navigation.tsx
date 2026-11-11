import { gsap } from "gsap";
import React, { useEffect, useRef } from "react";
import { css } from "styled-system/css";
import type { NavigationLink } from "@/types";

interface NavigationProps {
	links: NavigationLink[];
	currentSection?: string;
}

const Navigation: React.FC<NavigationProps> = ({ links, currentSection }) => {
	const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
	const backgroundRef = useRef<HTMLDivElement>(null);
	const isFirstHoverRef = useRef(true);
	const isHoveringRef = useRef(false);

	useEffect(() => {
		const background = backgroundRef.current;
		if (!background) return;

		// 最初は非表示にする
		gsap.set(background, { opacity: 0 });
	}, []);

	const updateBackgroundPosition = (index: number) => {
		const link = linkRefs.current[index];
		const background = backgroundRef.current;

		if (link && background) {
			isHoveringRef.current = true;

			// 実行してるアニメーションをすべて停止
			gsap.killTweensOf(background);

			// 2フレーム待ってより確実な位置を取得
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					// ホバー中でなければ何もしない
					if (!isHoveringRef.current) return;

					const dimensions = {
						x: link.offsetLeft,
						y: link.offsetTop,
						width: link.offsetWidth,
						height: link.offsetHeight,
					};

					// 初回ホバー時は位置を設定してフェードインのみ行う
					if (isFirstHoverRef.current) {
						gsap.set(background, {
							x: dimensions.x,
							y: dimensions.y,
							width: dimensions.width,
							height: dimensions.height,
						});
						gsap.to(background, {
							opacity: 1,
							duration: 0.2,
							ease: "power2.out",
						});
						isFirstHoverRef.current = false;
					} else {
						// 2回目以降はスムーズにアニメーション
						gsap.to(background, {
							x: dimensions.x,
							y: dimensions.y,
							width: dimensions.width,
							height: dimensions.height,
							opacity: 1,
							duration: 0.6,
							ease: "power2.out",
						});
					}
				});
			});
		}
	};

	const handleMouseEnter = (index: number) => {
		updateBackgroundPosition(index);
	};

	const handleContainerLeave = () => {
		isHoveringRef.current = false;
		const background = backgroundRef.current;
		if (background) {
			// 実行してるアニメーションをすべて停止
			gsap.killTweensOf(background);

			gsap.to(background, {
				opacity: 0,
				duration: 0.4,
				onComplete: () => {
					// フェードアウト完了後に初回フラグをリセット
					isFirstHoverRef.current = true;
				},
			});
		}
	};

	return (
		<nav
			className={css({
				display: "none",
				lg: {
					display: "flex",
				},
				position: "relative",
				alignItems: "center",
				marginX: "0.5rem",
			})}
			onMouseLeave={handleContainerLeave}
			role="navigation"
			aria-label="Main navigation"
		>
			{/* ホバーの背景 */}
			<div
				ref={backgroundRef}
				className={css({
					position: "absolute",
					borderRadius: "lg",
					backgroundColor: "sz.primary/20",
					border: "1px solid",
					borderColor: "sz.primary/30",
					pointerEvents: "none",
					zIndex: -1,
				})}
				style={{ willChange: "transform, opacity" }}
			/>

			{links.map((link, index) => (
				<a
					key={link.href}
					ref={(el: HTMLAnchorElement | null) => {
						linkRefs.current[index] = el;
					}}
					href={link.href}
					aria-current={currentSection === link.href ? "location" : undefined}
					className={`nav-link ${css({
						color: "sz.text.main",
						position: "relative",
						paddingX: "0.75rem",
						paddingY: "0.5rem",
						borderRadius: "lg",
						...(currentSection === link.href && {
							color: "sz.primary",
							fontWeight: "bold",
							_after: {
								content: '""',
								position: "absolute",
								left: "0.75rem",
								right: "0.75rem",
								bottom: "0.25rem",
								height: "1px",
								borderRadius: "full",
								backgroundColor: "sz.primary",
							},
						}),
						transition: "color 0.1s ease",
						_hover: {
							color: "sz.primary",
						},
					})}`}
					onMouseEnter={() => handleMouseEnter(index)}
					data-astro-prefetch
				>
					{link.label}
				</a>
			))}
		</nav>
	);
};

export default Navigation;
