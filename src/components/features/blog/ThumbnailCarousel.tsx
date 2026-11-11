import {
	Carousel,
	type CarouselDragStatusDetails,
	type UseCarouselReturn,
} from "@ark-ui/react/carousel";
import { type FocusEvent, useEffect, useRef } from "react";
import { css } from "styled-system/css";
import { Center, styled as s } from "styled-system/jsx";
import { carouselStyles } from "./recipes/carousel.recipe.ts";

const AUTOPLAY_DELAY = 5000;

type PauseReason = "focus" | "hover" | "visibility";

const interactionLayerClass = css({
	position: "relative",
	h: "full",
	w: "full",
});

const carouselClasses = carouselStyles();

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
	return (
		<svg
			aria-hidden="true"
			fill="none"
			height="24"
			viewBox="0 0 24 24"
			width="24"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d={direction === "left" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"}
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
		</svg>
	);
}

interface ThumbnailCarouselProps {
	images: string[];
	title: string;
}

export default function ThumbnailCarousel({
	images,
	title,
}: ThumbnailCarouselProps) {
	const carouselRef = useRef<UseCarouselReturn | null>(null);
	const pauseReasons = useRef(new Set<PauseReason>());
	const scrollResumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const clearScrollResumeTimer = () => {
		if (scrollResumeTimer.current === null) return;
		clearTimeout(scrollResumeTimer.current);
		scrollResumeTimer.current = null;
	};

	const resume = (carousel: UseCarouselReturn) => {
		if (images.length <= 1 || pauseReasons.current.size > 0) return;
		carousel.play();
	};

	const pauseFor = (carousel: UseCarouselReturn, reason: PauseReason) => {
		pauseReasons.current.add(reason);
		clearScrollResumeTimer();
		carousel.pause();
	};

	const release = (carousel: UseCarouselReturn, reason: PauseReason) => {
		pauseReasons.current.delete(reason);
		resume(carousel);
	};

	const restartAfterInteraction = (carousel: UseCarouselReturn) => {
		queueMicrotask(() => resume(carousel));
	};

	const resumeAfterScroll = (carousel: UseCarouselReturn) => {
		clearScrollResumeTimer();
		scrollResumeTimer.current = setTimeout(() => {
			scrollResumeTimer.current = null;
			resume(carousel);
		}, 200);
	};

	useEffect(() => {
		if (images.length <= 1) return;

		const syncVisibility = () => {
			const carousel = carouselRef.current;
			if (!carousel) return;

			if (document.visibilityState === "hidden") {
				pauseFor(carousel, "visibility");
			} else {
				release(carousel, "visibility");
			}
		};

		document.addEventListener("visibilitychange", syncVisibility);
		syncVisibility();

		return () => {
			document.removeEventListener("visibilitychange", syncVisibility);
			clearScrollResumeTimer();
		};
	}, [images.length]);

	const handleDragStatusChange = (details: CarouselDragStatusDetails) => {
		const carousel = carouselRef.current;
		if (!carousel) return;

		if (details.type === "dragging.end") {
			queueMicrotask(() => resume(carousel));
		}
	};

	return (
		<Carousel.Root
			allowMouseDrag={images.length > 1}
			aria-label={`${title}の画像`}
			autoplay={images.length > 1 ? { delay: AUTOPLAY_DELAY } : false}
			className={carouselClasses.root}
			onDragStatusChange={handleDragStatusChange}
			loop={images.length > 1}
			slideCount={images.length}
			translations={{
				indicator: (index) => `${title}の画像 ${index + 1}を表示`,
				item: (index) => `${title}の画像 ${index + 1}`,
				nextTrigger: "次の画像",
				prevTrigger: "前の画像",
			}}
		>
			<Carousel.Context>
				{(carousel) => {
					carouselRef.current = carousel;

					const handleFocus = (event: FocusEvent<HTMLDivElement>) => {
						if (
							!(event.target instanceof HTMLElement) ||
							!event.target.matches(":focus-visible")
						) {
							return;
						}
						const relatedTarget = event.relatedTarget;
						if (
							relatedTarget instanceof Node &&
							event.currentTarget.contains(relatedTarget)
						) {
							return;
						}
						pauseFor(carousel, "focus");
					};

					const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
						if (!pauseReasons.current.has("focus")) return;
						const relatedTarget = event.relatedTarget;
						if (
							relatedTarget instanceof Node &&
							event.currentTarget.contains(relatedTarget)
						) {
							return;
						}
						release(carousel, "focus");
					};

					return (
						<div
							className={interactionLayerClass}
							onBlur={handleBlur}
							onFocus={handleFocus}
							onPointerEnter={(event) => {
								if (event.pointerType === "mouse") {
									pauseFor(carousel, "hover");
								}
							}}
							onPointerLeave={(event) => {
								if (event.pointerType === "mouse") {
									release(carousel, "hover");
								}
							}}
						>
							<Carousel.ItemGroup
								className={carouselClasses.itemGroup}
								onScroll={() => resumeAfterScroll(carousel)}
							>
								{images.map((image, index) => (
									<Carousel.Item
										className={carouselClasses.item}
										index={index}
										key={index}
									>
										<Center w="full" h="full">
											<s.img
												src={image}
												alt={`${title}の画像 ${index + 1}`}
												loading={index === 0 ? "eager" : "lazy"}
												fetchPriority={index === 0 ? "high" : "low"}
												decoding="async"
												w="auto"
												maxW="full"
												h="auto"
												maxH="500px"
												rounded="xl"
												objectFit="contain"
											/>
										</Center>
									</Carousel.Item>
								))}
							</Carousel.ItemGroup>

							{images.length > 1 && (
								<Carousel.Control className={carouselClasses.control}>
									<Carousel.PrevTrigger
										className={carouselClasses.prevTrigger}
										onClick={() => restartAfterInteraction(carousel)}
									>
										<ChevronIcon direction="left" />
									</Carousel.PrevTrigger>
									<Carousel.NextTrigger
										className={carouselClasses.nextTrigger}
										onClick={() => restartAfterInteraction(carousel)}
									>
										<ChevronIcon direction="right" />
									</Carousel.NextTrigger>
								</Carousel.Control>
							)}

							{images.length > 1 && (
								<Carousel.IndicatorGroup
									className={carouselClasses.indicatorGroup}
								>
									{images.map((_, index) => (
										<Carousel.Indicator
											className={carouselClasses.indicator}
											index={index}
											key={index}
											onClick={() => restartAfterInteraction(carousel)}
										/>
									))}
								</Carousel.IndicatorGroup>
							)}
						</div>
					);
				}}
			</Carousel.Context>
		</Carousel.Root>
	);
}
