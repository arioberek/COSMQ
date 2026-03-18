import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { PhoneMockup } from "./phone-mockup";
import { useCallback, useRef, useEffect } from "react";

// ── Alien SVG path data (from apps/mobile/assets/logos/alien.svg) ──
const ALIEN_PATHS = [
	// Body (main outline)
	"M304.99 35.3894C310.965 34.436 322.252 36.267 328.361 37.8403C348.307 42.9776 365.434 54.8974 375.95 72.8141C387.305 92.1617 389.441 116.202 383.647 137.679C376.676 163.518 358.788 193.441 335.183 207.136C336.086 209.713 337.637 213.529 338.039 216.107C338.599 219.695 338.411 223.62 339.429 227.189C340.788 231.954 343.119 236.251 345.005 240.76C347.709 247.226 350.45 253.459 353.363 259.831C362.187 256.159 370.9 252.224 379.487 248.03C379.231 243.441 379.239 239.59 380.637 235.167C382.244 230.084 384.687 223.611 389.738 221.03C392.988 219.37 396.928 218.996 400.373 220.126C402.403 214.958 407.451 201.816 412.252 199.35C418.214 197.449 427.785 203.458 432.715 205.228C450.111 211.472 451.122 213.799 443.359 230.741C447.956 234.09 451.561 240.626 445.957 245.03C444.895 245.864 443.732 246.399 442.527 246.994C443.211 252.718 442.787 254.568 437.863 257.565C437.995 263.087 437.329 264.74 432.418 267.361C432.457 274.148 429.387 277.402 422.501 276.431C417.35 286.592 411.689 283.178 403.231 279.421C401.933 278.845 400.609 278.222 399.318 277.628C394.154 280.66 387.995 283.764 382.605 286.579C372.987 291.457 363.407 296.894 352.898 299.615C336.55 303.848 327.85 289.529 320.179 277.976C316.098 284.058 309.743 288.503 305.612 293.547C303.985 295.533 298.26 307.588 296.799 310.675C293.516 317.609 288.032 327.118 285.287 334.092C299.292 344.8 315.994 354.411 328.558 366.942C334.471 372.84 339.581 389.533 342.77 397.869C346.492 407.578 350.268 417.265 354.098 426.93C357.242 434.857 359.936 442.25 364.172 449.666C377.176 448.644 390.2 443.679 403.216 447.088C408.258 448.409 413.466 453.695 411.337 459.117C408.276 466.915 398.238 471.924 391.276 475.85C386.458 478.566 381.33 480.727 376.438 483.3C367.962 487.417 354.235 495.366 344.772 492.492C336.585 490.007 333.108 475.63 329.546 468.51C326.298 462.396 322.811 457.569 318.928 451.88C312.063 441.822 304.737 431.987 298.841 421.323C297.146 418.208 295.543 415.043 294.034 411.834C287.074 397.063 289.729 398.579 273.857 391.797C263.716 387.463 252.839 382.102 242.742 377.501C238.348 381.505 234.324 385.906 230.104 390.092C222.335 397.798 213.891 405.426 204.679 411.387C199.629 414.655 193.929 417.32 187.879 417.938C174.587 419.298 159.626 412.192 147.429 407.484C141.661 405.258 135.836 403.204 130.022 401.102C125.894 399.609 121.665 397.851 117.357 396.969C108.189 395.092 101.777 401.726 94.7441 406.334C90.4454 409.151 84.9599 411.877 79.6692 410.686C77.1261 410.113 74.4974 408.485 73.1313 406.229C71.2606 403.142 71.415 399.267 72.2124 395.872C74.7375 385.119 91.1721 361.125 100.626 355.404C103.903 353.422 107.637 352.775 111.402 353.502C117.852 354.749 121.385 360.856 127.515 362.683C133.287 364.404 139.513 364.751 145.447 365.712C154.624 367.199 163.743 369.018 172.788 371.165C181.758 360.256 188.776 347.322 197.188 336.227C195.86 324.222 196.057 319.961 199.229 308.015C192.85 308.002 187.206 308.268 180.603 307.999C162.364 307.256 143.169 303.628 127.146 294.551C123.337 292.418 117.592 287.539 116.951 282.873C116.007 276.004 118.515 266.05 119.723 259.143L127.242 217.753L134.117 177.933C135.374 170.561 136.516 163.097 138.006 155.781C138.506 153.326 139.379 149.122 140.793 147.133C144.218 142.865 152.714 140.923 158.019 140.251C185.107 136.825 214.636 138.869 240.338 148.389C243.326 149.496 248.395 151.633 250.792 153.322C249.133 149.822 246.75 145.914 244.946 142.326C240.086 132.839 237.003 122.543 235.847 111.946C234.045 93.9039 239.576 75.8945 251.194 61.9731C261.067 49.7102 274.768 41.1139 290.105 37.561C295.213 36.385 299.787 35.9129 304.99 35.3894Z",
	// Left eye
	"M280.894 104.377C301.437 102.81 319.985 122.188 322.827 141.584C324.007 149.64 321.169 152.105 313.663 153.1C294.419 153.245 275.02 136.893 271.448 118.056C269.987 110.35 272.979 105.566 280.894 104.377Z",
	// Right eye
	"M365.503 107.815C374.978 107.27 374.829 113.726 374.054 121.111C372.487 136.039 363.109 149.482 348.067 153.132C344.265 153.183 339.998 151.412 339.393 147.399C336.948 131.187 350.259 111.871 365.503 107.815Z",
];

// ── Magnetic CTA button ──
function MagneticButton({
	children,
	href,
	variant = "primary",
}: {
	children: React.ReactNode;
	href: string;
	variant?: "primary" | "secondary";
}) {
	const ref = useRef<HTMLAnchorElement>(null);
	const x = useMotionValue(0);
	const y = useMotionValue(0);
	const springX = useSpring(x, { stiffness: 300, damping: 20 });
	const springY = useSpring(y, { stiffness: 300, damping: 20 });

	const handleMouse = useCallback(
		(e: React.MouseEvent) => {
			const rect = ref.current?.getBoundingClientRect();
			if (!rect) return;
			x.set((e.clientX - (rect.left + rect.width / 2)) * 0.2);
			y.set((e.clientY - (rect.top + rect.height / 2)) * 0.2);
		},
		[x, y],
	);

	const handleLeave = useCallback(() => {
		x.set(0);
		y.set(0);
	}, [x, y]);

	const base =
		variant === "primary"
			? "bg-[#7c5cff] text-white shadow-[0_0_50px_rgba(124,92,255,0.35)] hover:shadow-[0_0_80px_rgba(124,92,255,0.55)] hover:bg-[#8b6fff]"
			: "bg-white/[0.04] text-[#aaa] border border-white/[0.1] hover:border-[#7c5cff]/40 hover:text-white hover:bg-white/[0.06]";

	return (
		<motion.a
			ref={ref}
			href={href}
			style={{ x: springX, y: springY }}
			onMouseMove={handleMouse}
			onMouseLeave={handleLeave}
			whileTap={{ scale: 0.95 }}
			className={`inline-flex items-center px-8 py-4 rounded-full font-semibold text-[15px] no-underline transition-all duration-300 tracking-wide ${base}`}
		>
			{children}
		</motion.a>
	);
}

// ── Animated alien: stroke-only, draw-on, with glow + parallax ──
function AlienStroke() {
	const containerRef = useRef<HTMLDivElement>(null);
	const mouseX = useMotionValue(0);
	const mouseY = useMotionValue(0);

	const springX = useSpring(mouseX, { stiffness: 40, damping: 30 });
	const springY = useSpring(mouseY, { stiffness: 40, damping: 30 });

	// Different parallax depths for each layer
	const layer1X = useTransform(springX, [-0.5, 0.5], [-20, 20]);
	const layer1Y = useTransform(springY, [-0.5, 0.5], [-14, 14]);
	const layer2X = useTransform(springX, [-0.5, 0.5], [-12, 12]);
	const layer2Y = useTransform(springY, [-0.5, 0.5], [-8, 8]);

	useEffect(() => {
		const handleMove = (e: MouseEvent) => {
			if (!containerRef.current) return;
			const rect = containerRef.current.getBoundingClientRect();
			mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
			mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
		};
		window.addEventListener("mousemove", handleMove, { passive: true });
		return () => window.removeEventListener("mousemove", handleMove);
	}, [mouseX, mouseY]);

	return (
		<div
			ref={containerRef}
			className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
		>
			{/* Pulsing energy rings */}
			{[0, 1, 2].map((i) => (
				<motion.div
					key={i}
					className="absolute rounded-full border border-[#7c5cff]/20"
					initial={{ opacity: 0, scale: 0.2 }}
					animate={{
						opacity: [0, 0.12, 0],
						scale: [0.2, 1 + i * 0.4, 1.6 + i * 0.4],
					}}
					transition={{
						duration: 5,
						delay: i * 1.6,
						repeat: Infinity,
						ease: "easeOut",
					}}
					style={{ width: "50%", height: "50%" }}
				/>
			))}

			{/* Glow layer — blurred stroke copy for neon effect */}
			<motion.div className="absolute" style={{ x: layer1X, y: layer1Y }}>
				<svg
					viewBox="0 0 510 498"
					className="w-[65vw] max-w-[750px] h-auto"
					aria-hidden="true"
				>
					<defs>
						<filter id="alien-blur-heavy">
							<feGaussianBlur in="SourceGraphic" stdDeviation="8" />
						</filter>
					</defs>
					{ALIEN_PATHS.map((d, i) => (
						<motion.path
							key={i}
							d={d}
							fill="none"
							stroke="#7c5cff"
							strokeWidth={i === 0 ? 2.5 : 2}
							filter="url(#alien-blur-heavy)"
							initial={{ pathLength: 0, opacity: 0 }}
							animate={{ pathLength: 1, opacity: 0.35 }}
							transition={{
								pathLength: {
									duration: 3.5,
									delay: i * 0.3,
									ease: [0.22, 1, 0.36, 1],
								},
								opacity: { duration: 1, delay: i * 0.3 },
							}}
						/>
					))}
				</svg>
			</motion.div>

			{/* Main alien — crisp strokes, draw-on animation */}
			<motion.div className="absolute" style={{ x: layer2X, y: layer2Y }}>
				<svg
					viewBox="0 0 510 498"
					className="w-[55vw] max-w-[640px] h-auto"
					aria-hidden="true"
				>
					<defs>
						<linearGradient
							id="alien-stroke-grad"
							x1="0%"
							y1="0%"
							x2="100%"
							y2="100%"
						>
							<stop offset="0%" stopColor="#7c5cff" />
							<stop offset="50%" stopColor="#a78bfa" />
							<stop offset="100%" stopColor="#e040fb" />
						</linearGradient>
						<filter id="alien-glow-tight">
							<feGaussianBlur in="SourceGraphic" stdDeviation="2" />
						</filter>
					</defs>

					{/* Glow copy behind main stroke */}
					{ALIEN_PATHS.map((d, i) => (
						<motion.path
							key={`glow-${i}`}
							d={d}
							fill="none"
							stroke="url(#alien-stroke-grad)"
							strokeWidth={i === 0 ? 1.5 : 1.2}
							strokeLinecap="round"
							strokeLinejoin="round"
							filter="url(#alien-glow-tight)"
							initial={{ pathLength: 0, opacity: 0 }}
							animate={{ pathLength: 1, opacity: 0.5 }}
							transition={{
								pathLength: {
									duration: 3,
									delay: 0.2 + i * 0.4,
									ease: [0.22, 1, 0.36, 1],
								},
								opacity: {
									duration: 0.8,
									delay: 0.2 + i * 0.4,
								},
							}}
						/>
					))}

					{/* Main crisp strokes */}
					{ALIEN_PATHS.map((d, i) => (
						<motion.path
							key={`main-${i}`}
							d={d}
							fill="none"
							stroke="url(#alien-stroke-grad)"
							strokeWidth={i === 0 ? 0.8 : 0.6}
							strokeLinecap="round"
							strokeLinejoin="round"
							initial={{ pathLength: 0, opacity: 0 }}
							animate={{
								pathLength: 1,
								opacity: i === 0 ? 0.4 : 0.6,
							}}
							transition={{
								pathLength: {
									duration: 3,
									delay: 0.2 + i * 0.4,
									ease: [0.22, 1, 0.36, 1],
								},
								opacity: {
									duration: 0.8,
									delay: 0.2 + i * 0.4,
								},
							}}
						/>
					))}

					{/* Animated eye pulse — stroke-only after draw completes */}
					{ALIEN_PATHS.slice(1, 3).map((d, i) => (
						<motion.path
							key={`pulse-${i}`}
							d={d}
							fill="none"
							stroke={i === 0 ? "#a78bfa" : "#c084fc"}
							strokeWidth={0.5}
							initial={{ opacity: 0 }}
							animate={{
								opacity: [0, 0.6, 0.2, 0.6, 0],
								strokeWidth: [0.5, 1.2, 0.5, 1.2, 0.5],
							}}
							transition={{
								duration: 4,
								delay: 3.5 + i * 0.3,
								repeat: Infinity,
								repeatDelay: 3,
								ease: "easeInOut",
							}}
						/>
					))}
				</svg>
			</motion.div>
		</div>
	);
}

const headingWords = ["Your databases.", "Everywhere."];

export const HeroSection = () => {
	return (
		<section className="relative min-h-screen flex items-center overflow-hidden">
			{/* Base layers */}
			<div className="absolute inset-0 aurora-bg" />
			<div className="absolute inset-0 grid-pattern opacity-30" />

			{/* Alien stroke animation — the centerpiece */}
			<AlienStroke />

			{/* Content */}
			<div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-10 w-full grid lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-16 items-center pt-28 pb-20 lg:pt-0 lg:pb-0">
				<div className="text-center lg:text-left flex flex-col items-center lg:items-start">
					{/* Badge */}
					<motion.div
						initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
						animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
						transition={{ duration: 0.6, delay: 0.2 }}
						className="inline-flex items-center gap-2.5 bg-white/[0.04] text-[#9d85ff] px-5 py-2.5 rounded-full text-[13px] font-medium mb-10 border border-[rgba(124,92,255,0.15)] backdrop-blur-md"
					>
						<span className="w-1.5 h-1.5 rounded-full bg-[#7c5cff] glow-pulse" />
						Open Source Mobile Database Client
					</motion.div>

					{/* Heading */}
					<h1 className="text-[clamp(3rem,9vw,6.5rem)] leading-[0.9] mb-8 font-black tracking-[-0.05em]">
						{headingWords.map((word, i) => (
							<motion.span
								key={word}
								className={`block ${
									i === 1
										? "bg-gradient-to-r from-[#7c5cff] via-[#c084fc] to-[#e040fb] bg-clip-text text-transparent text-shimmer"
										: "text-white"
								}`}
								initial={{ opacity: 0, y: 50, filter: "blur(12px)" }}
								animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
								transition={{
									duration: 0.8,
									delay: 0.3 + i * 0.2,
									ease: [0.22, 1, 0.36, 1],
								}}
							>
								{word}
							</motion.span>
						))}
					</h1>

					{/* Subheading */}
					<motion.p
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.7, delay: 0.7 }}
						className="text-[clamp(1rem,2.2vw,1.3rem)] text-[#666] max-w-[500px] mx-auto lg:mx-0 mb-12 leading-[1.7] font-normal"
					>
						Connect directly to PostgreSQL, MySQL, MongoDB & more.
						Execute queries and visualize results with native performance
						— all from your phone.
					</motion.p>

					{/* CTAs */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.9 }}
						className="flex flex-wrap gap-4 justify-center lg:justify-start"
					>
						<MagneticButton
							href="https://github.com/arioberek/COSMQ"
							variant="primary"
						>
							View on GitHub
						</MagneticButton>
						<MagneticButton href="#features" variant="secondary">
							Learn More
						</MagneticButton>
					</motion.div>

					{/* Stats */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 1, delay: 1.2 }}
						className="flex gap-10 mt-16 pt-8 border-t border-white/[0.06]"
					>
						{[
							{ value: "6+", label: "Databases" },
							{ value: "TCP", label: "Direct Conn" },
							{ value: "E2E", label: "Encrypted" },
						].map((stat) => (
							<div key={stat.label} className="text-center lg:text-left">
								<div className="text-white text-2xl font-black tracking-tight font-['JetBrains_Mono',monospace]">
									{stat.value}
								</div>
								<div className="text-[#444] text-[11px] tracking-[0.15em] uppercase mt-1.5 font-medium">
									{stat.label}
								</div>
							</div>
						))}
					</motion.div>
				</div>

				{/* Phone — proper iPhone frame with real screenshot */}
				<div className="flex justify-center lg:justify-end">
					<PhoneMockup />
				</div>
			</div>

			{/* Bottom fade */}
			<div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#06060a] to-transparent pointer-events-none z-20" />

			{/* Scan lines */}
			<div className="absolute inset-0 pointer-events-none z-30 opacity-[0.015]" style={{
				background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
			}} />
		</section>
	);
};
