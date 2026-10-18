import {
	AnimatePresence,
	MotionConfig,
	motion,
	useReducedMotion,
	useScroll,
	useTransform,
} from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

/** Built in index.astro with astro:assets (resized WebP), so the island ships no image pipeline. */
export interface ScreenshotImage {
	/** Card image, ~2x its displayed width. */
	src: string;
	srcSet: string;
	/** Larger rendition for the enlarged viewer. */
	full: string;
	width: number;
	height: number;
}

interface Screenshot {
	alt: string;
	label: string;
}

// Same order as the images passed in from index.astro.
const screenshots: Screenshot[] = [
	{
		alt: "COSMQ connection list with saved PostgreSQL, MySQL and CockroachDB databases",
		label: "Connections",
	},
	{
		alt: "New connection form with a connection URL field, colour tags and database type picker",
		label: "New connection",
	},
	{
		alt: "Connection details for a PostgreSQL database showing host, port and user",
		label: "Connection details",
	},
	{
		alt: "Settings screen with dark mode, Face ID app lock and auto-rollback timer",
		label: "Settings",
	},
];

// Cards are 4-up from lg (max 1080px wide), 2-up below.
const CARD_SIZES = "(min-width: 1024px) 260px, 45vw";

// Uneven on purpose: the row drifts apart slightly as it scrolls past.
const PARALLAX_OFFSETS = [28, 12, 36, 20] as const;

/**
 * Displays screenshot cards with reduced-motion-aware parallax and an enlarged modal viewer.
 * Traps focus and locks scrolling while the viewer is open, then restores trigger focus.
 */
export function ScreenshotsSection({ images }: { images: ScreenshotImage[] }) {
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
	const selectedImage = selectedIndex === null ? null : screenshots[selectedIndex];
	const selectedSrc = selectedIndex === null ? null : images[selectedIndex];
	const modalRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement | null>(null);
	const sectionRef = useRef<HTMLDivElement>(null);
	const reduceMotion = useReducedMotion();

	const { scrollYProgress } = useScroll({
		target: sectionRef,
		offset: ["start end", "end start"],
	});

	const closeModal = useCallback(() => {
		setSelectedIndex(null);
	}, []);

	useEffect(() => {
		if (!selectedImage || !modalRef.current) return;
		document.body.style.overflow = "hidden";

		const closeBtn = modalRef.current.querySelector<HTMLButtonElement>(
			"button[aria-label='Close']",
		);
		closeBtn?.focus();

		const focusableEls = modalRef.current.querySelectorAll<HTMLElement>(
			'button, [href], [tabindex]:not([tabindex="-1"])',
		);
		const firstEl = focusableEls[0];
		const lastEl = focusableEls[focusableEls.length - 1];

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				closeModal();
				return;
			}
			if (event.key === "Tab" && focusableEls.length > 0) {
				if (event.shiftKey && document.activeElement === firstEl) {
					event.preventDefault();
					lastEl?.focus();
				} else if (!event.shiftKey && document.activeElement === lastEl) {
					event.preventDefault();
					firstEl?.focus();
				}
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			document.body.style.overflow = "";
			triggerRef.current?.focus();
		};
	}, [selectedImage, closeModal]);

	const amount = reduceMotion ? 0 : 1;
	const offsets = [
		useTransform(
			scrollYProgress,
			[0, 1],
			[PARALLAX_OFFSETS[0] * amount, -PARALLAX_OFFSETS[0] * amount],
		),
		useTransform(
			scrollYProgress,
			[0, 1],
			[PARALLAX_OFFSETS[1] * amount, -PARALLAX_OFFSETS[1] * amount],
		),
		useTransform(
			scrollYProgress,
			[0, 1],
			[PARALLAX_OFFSETS[2] * amount, -PARALLAX_OFFSETS[2] * amount],
		),
		useTransform(
			scrollYProgress,
			[0, 1],
			[PARALLAX_OFFSETS[3] * amount, -PARALLAX_OFFSETS[3] * amount],
		),
	];

	return (
		<MotionConfig reducedMotion="user">
			<section
				ref={sectionRef}
				id="screenshots"
				className="relative pt-20 pb-16 md:pt-28 md:pb-20 px-6 lg:px-10 overflow-hidden"
			>
				<div className="relative max-w-[1280px] mx-auto">
					<motion.div
						className="text-center mb-14 md:mb-16"
						initial={{ opacity: 0, y: 12 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-80px" }}
						transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
					>
						<span className="eyebrow mb-6">
							<span className="eyebrow-num">02</span>
							<span className="eyebrow-rule" />
							<span>Inside</span>
						</span>
						<h2 className="text-[clamp(2rem,5vw,3.25rem)] font-semibold tracking-[-0.035em] leading-[1.08] text-foreground">
							What it <span className="font-display font-normal">looks like.</span>
						</h2>
					</motion.div>

					<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 max-w-[1080px] mx-auto">
						{screenshots.map((screenshot, i) => (
							// Parallax lives on the wrapper so it never fights the entry animation for `y`.
							<motion.div key={screenshot.label} style={{ y: offsets[i] }}>
								<motion.button
									type="button"
									className="relative w-full cursor-zoom-in group"
									aria-label={`Enlarge screenshot: ${screenshot.label}`}
									initial={{ opacity: 0, y: 24 }}
									whileInView={{ opacity: 1, y: 0 }}
									viewport={{ once: true, margin: "-60px" }}
									transition={{
										duration: 0.6,
										delay: i * 0.06,
										ease: [0.23, 1, 0.32, 1],
									}}
									whileHover={{ scale: 1.015 }}
									whileTap={{ scale: 0.98 }}
									onClick={(e) => {
										triggerRef.current = e.currentTarget as HTMLButtonElement;
										setSelectedIndex(i);
									}}
								>
									<div className="rounded-2xl overflow-hidden border border-border bg-card shadow-[0_24px_60px_-12px_hsl(var(--shadow-tint)/0.8)] group-hover:border-foreground/15 transition-colors duration-200">
										<img
											src={images[i]?.src}
											srcSet={images[i]?.srcSet}
											sizes={CARD_SIZES}
											width={images[i]?.width}
											height={images[i]?.height}
											alt={screenshot.alt}
											className="w-full h-auto object-cover"
											loading="lazy"
											decoding="async"
										/>
									</div>
									<div className="mt-4 text-[13px] font-medium text-muted-foreground text-center group-hover:text-foreground transition-colors duration-200">
										{screenshot.label}
									</div>
								</motion.button>
							</motion.div>
						))}
					</div>
				</div>

				<AnimatePresence>
					{selectedImage && selectedSrc && (
						<motion.div
							ref={modalRef}
							className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4"
							style={{ background: "hsl(var(--background) / 0.94)" }}
							role="dialog"
							aria-modal="true"
							aria-label={selectedImage.alt}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1, transition: { duration: 0.2 } }}
							exit={{ opacity: 0, transition: { duration: 0.15 } }}
							onClick={closeModal}
						>
							<motion.div
								className="relative"
								initial={{ scale: 0.95, opacity: 0 }}
								animate={{
									scale: 1,
									opacity: 1,
									transition: { type: "spring", duration: 0.35, bounce: 0.1 },
								}}
								exit={{ scale: 0.97, opacity: 0, transition: { duration: 0.15, ease: "easeOut" } }}
								onClick={(e) => e.stopPropagation()}
							>
								<button
									type="button"
									className="absolute -top-14 right-0 inline-flex items-center justify-center w-11 h-11 rounded-full text-muted-foreground hover:text-foreground hover:bg-card active:scale-[0.97] transition-[color,background-color,transform] duration-200"
									onClick={closeModal}
									aria-label="Close"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="20"
										height="20"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="1.6"
										strokeLinecap="round"
										strokeLinejoin="round"
										aria-hidden="true"
									>
										<line x1="18" y1="6" x2="6" y2="18" />
										<line x1="6" y1="6" x2="18" y2="18" />
									</svg>
								</button>
								<img
									src={selectedSrc?.full}
									width={selectedSrc?.width}
									height={selectedSrc?.height}
									alt={selectedImage.alt}
									className="max-h-[calc(100dvh-8rem)] w-auto rounded-2xl border border-border shadow-[0_32px_80px_-16px_hsl(var(--shadow-tint)/0.9)]"
								/>
							</motion.div>
						</motion.div>
					)}
				</AnimatePresence>
			</section>
		</MotionConfig>
	);
}
