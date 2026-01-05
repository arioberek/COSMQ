"use client";

import { AnimatePresence, motion, type Variants } from "motion/react";
import { useCallback, useEffect, useState } from "react";

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
	{
		src: Screenshot1,
		alt: "COSMQ - Connection List",
		label: "Manage Connections",
	},
	{ src: Screenshot2, alt: "COSMQ - New Connection", label: "Add Database" },
	{ src: Screenshot3, alt: "COSMQ - Query Editor", label: "Write Queries" },
	{ src: Screenshot4, alt: "COSMQ - Results View", label: "View Results" },
];

const fadeInUp: Variants = {
	hidden: { opacity: 0, y: 30 },
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.6,
			ease: "easeOut",
		},
	},
};

const staggerContainer: Variants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.15,
			delayChildren: 0.2,
		},
	},
};

const modalOverlay: Variants = {
	hidden: { opacity: 0 },
	visible: { opacity: 1 },
	exit: { opacity: 0 },
};

const modalContent: Variants = {
	hidden: { opacity: 0, scale: 0.9 },
	visible: {
		opacity: 1,
		scale: 1,
		transition: { type: "spring", stiffness: 300, damping: 25 },
	},
	exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
};

export function ScreenshotsSection() {
	const [selectedImage, setSelectedImage] = useState<Screenshot | null>(null);

	const closeModal = useCallback(() => {
		setSelectedImage(null);
	}, []);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				closeModal();
			}
		};

		if (selectedImage) {
			document.addEventListener("keydown", handleKeyDown);
			document.body.style.overflow = "hidden";
		}

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			document.body.style.overflow = "";
		};
	}, [selectedImage, closeModal]);

	return (
		<section className="py-20 px-6 overflow-hidden">
			<div className="max-w-[1200px] mx-auto">
				<motion.div
					className="text-center mb-12"
					initial={{ opacity: 0, y: -10 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.5 }}
				>
					<h2 className="text-4xl font-bold mb-4 text-[#f0f0f5]">
						See it in action
					</h2>
					<p className="text-[#b8b8c8] text-lg max-w-[500px] mx-auto">
						Professional database management designed for mobile
					</p>
				</motion.div>

				<motion.div
					className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true }}
					variants={staggerContainer}
				>
					{screenshots.map((screenshot) => (
						<motion.button
							key={screenshot.label}
							type="button"
							className="relative cursor-zoom-in"
							variants={fadeInUp}
							whileHover={{ y: -8, scale: 1.02 }}
							transition={{ type: "spring", stiffness: 300, damping: 20 }}
							onClick={() => setSelectedImage(screenshot)}
						>
							<div className="rounded-2xl overflow-hidden border border-white/[0.08] bg-[#13131a] shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
								<img
									src={screenshot.src.src}
									width={screenshot.src.width}
									height={screenshot.src.height}
									alt={screenshot.alt}
									className="w-full h-auto object-cover"
									loading="lazy"
								/>
							</div>
						</motion.button>
					))}
				</motion.div>
			</div>

			<AnimatePresence>
				{selectedImage && (
					<motion.div
						className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
						variants={modalOverlay}
						initial="hidden"
						animate="visible"
						exit="exit"
						onClick={closeModal}
					>
						<motion.div
							className="relative"
							variants={modalContent}
							initial="hidden"
							animate="visible"
							exit="exit"
							onClick={(e) => e.stopPropagation()}
						>
							<button
								type="button"
								className="absolute -top-10 right-0 text-[#b8b8c8] hover:text-[#f0f0f5] transition-colors"
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
									strokeWidth="2"
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
								className="max-h-[80vh] w-auto rounded-2xl border border-white/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
							/>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</section>
	);
}
