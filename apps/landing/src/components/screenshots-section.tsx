import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

import Screenshot1 from "@/assets/screenshots/app/1.jpeg";
import Screenshot2 from "@/assets/screenshots/app/2.jpeg";
import Screenshot3 from "@/assets/screenshots/app/3.jpeg";
import Screenshot4 from "@/assets/screenshots/app/4.jpeg";

interface Screenshot {
	src: ImageMetadata;
	alt: string;
	label: string;
}

const screenshots: Screenshot[] = [
	{ src: Screenshot1, alt: "COSMQ - Connection List", label: "Connections" },
	{ src: Screenshot2, alt: "COSMQ - New Connection", label: "Add Database" },
	{ src: Screenshot3, alt: "COSMQ - Query Editor", label: "Write Queries" },
	{ src: Screenshot4, alt: "COSMQ - Results View", label: "View Results" },
];

export function ScreenshotsSection() {
	const [selectedImage, setSelectedImage] = useState<Screenshot | null>(null);
	const modalRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement | null>(null);
	const sectionRef = useRef<HTMLDivElement>(null);

	const { scrollYProgress } = useScroll({
		target: sectionRef,
		offset: ["start end", "end start"],
	});

	const closeModal = useCallback(() => {
		setSelectedImage(null);
	}, []);

	useEffect(() => {
		if (!selectedImage || !modalRef.current) return;
		document.body.style.overflow = "hidden";

		const closeBtn = modalRef.current.querySelector<HTMLButtonElement>(
			"button[aria-label='Close modal']",
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

	// Parallax offsets for each card
	const offsets = [
		useTransform(scrollYProgress, [0, 1], [40, -40]),
		useTransform(scrollYProgress, [0, 1], [20, -20]),
		useTransform(scrollYProgress, [0, 1], [60, -60]),
		useTransform(scrollYProgress, [0, 1], [30, -30]),
	];

	return (
		<section ref={sectionRef} className="relative py-32 px-6 lg:px-10 overflow-hidden">
			{/* Section bg accent */}
			<div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#7c5cff]/[0.02] to-transparent pointer-events-none" />

			<div className="relative max-w-[1400px] mx-auto">
				{/* Header */}
				<div className="text-center mb-16">
					<motion.span
						initial={{ opacity: 0 }}
						whileInView={{ opacity: 1 }}
						viewport={{ once: true }}
						className="inline-block text-[11px] font-mono uppercase tracking-[0.3em] text-[#555] mb-5"
					>
						Preview
					</motion.span>
					<motion.h2
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6, delay: 0.1 }}
						className="text-[clamp(2rem,5vw,3.5rem)] font-bold tracking-[-0.03em] leading-[1.1] text-white"
					>
						See it in action
					</motion.h2>
				</div>

				{/* Screenshot grid with parallax */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
					{screenshots.map((screenshot, i) => (
						<motion.button
							key={screenshot.label}
							type="button"
							className="relative cursor-zoom-in group"
							aria-label={`View ${screenshot.label} screenshot`}
							style={{ y: offsets[i] }}
							initial={{ opacity: 0, y: 40 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{
								duration: 0.6,
								delay: i * 0.1,
								ease: [0.25, 0.46, 0.45, 0.94],
							}}
							whileHover={{ scale: 1.03 }}
							whileTap={{ scale: 0.98 }}
							onClick={(e) => {
								triggerRef.current = e.currentTarget as HTMLButtonElement;
								setSelectedImage(screenshot);
							}}
						>
							<div className="rounded-2xl overflow-hidden border border-white/[0.05] bg-[#0c0c12] shadow-[0_20px_60px_rgba(0,0,0,0.5)] group-hover:border-white/[0.1] group-hover:shadow-[0_20px_60px_rgba(124,92,255,0.1)] transition-all duration-500">
								<img
									src={screenshot.src.src}
									width={screenshot.src.width}
									height={screenshot.src.height}
									alt={screenshot.alt}
									className="w-full h-auto object-cover"
									loading="lazy"
								/>
							</div>
							<div className="mt-3 text-[12px] text-[#555] font-medium tracking-wider uppercase text-center group-hover:text-[#888] transition-colors duration-300">
								{screenshot.label}
							</div>
						</motion.button>
					))}
				</div>
			</div>

			{/* Lightbox modal */}
			<AnimatePresence>
				{selectedImage && (
					<motion.div
						ref={modalRef}
						className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md"
						style={{ background: "rgba(6,6,10,0.92)" }}
						role="dialog"
						aria-modal="true"
						aria-label={selectedImage.alt}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.25 }}
						onClick={closeModal}
					>
						<motion.div
							className="relative"
							initial={{ scale: 0.85, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.9, opacity: 0 }}
							transition={{ type: "spring", stiffness: 400, damping: 30 }}
							onClick={(e) => e.stopPropagation()}
						>
							<button
								type="button"
								className="absolute -top-12 right-0 text-[#555] hover:text-white transition-colors p-1"
								onClick={closeModal}
								aria-label="Close modal"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
									aria-hidden="true"
								>
									<line x1="18" y1="6" x2="6" y2="18" />
									<line x1="6" y1="6" x2="18" y2="18" />
								</svg>
							</button>
							<img
								src={selectedImage.src.src}
								width={selectedImage.src.width}
								height={selectedImage.src.height}
								alt={selectedImage.alt}
								className="max-h-[80vh] w-auto rounded-2xl border border-white/[0.06] shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
							/>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</section>
	);
}
