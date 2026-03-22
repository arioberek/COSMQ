import { motion } from "motion/react";
import { useCallback, useRef } from "react";
import { Icons } from "./icons";

const databases = [
	{ icon: Icons.postgresql, name: "PostgreSQL" },
	{ icon: Icons.mysql, name: "MySQL" },
	{ icon: Icons.mongodb, name: "MongoDB" },
	{ icon: Icons.sqlite, name: "SQLite" },
	{ icon: Icons.cockroachdb, name: "CockroachDB" },
	{ icon: Icons.mariadb, name: "MariaDB" },
];

function SpotlightGrid() {
	const gridRef = useRef<HTMLDivElement>(null);

	const handleMouseMove = useCallback((e: React.MouseEvent) => {
		const grid = gridRef.current;
		if (!grid) return;
		const rect = grid.getBoundingClientRect();
		grid.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
		grid.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
	}, []);

	const handleMouseLeave = useCallback(() => {
		const grid = gridRef.current;
		if (!grid) return;
		grid.style.setProperty("--spot-x", `-1000px`);
		grid.style.setProperty("--spot-y", `-1000px`);
	}, []);

	return (
		<div
			ref={gridRef}
			className="grid grid-cols-2 md:grid-cols-3 gap-[1px] relative db-spotlight-grid"
			onMouseMove={handleMouseMove}
			onMouseLeave={handleMouseLeave}
			style={
				{
					"--spot-x": "-1000px",
					"--spot-y": "-1000px",
				} as React.CSSProperties
			}
		>
			{databases.map((db, i) => (
				<motion.div
					key={db.name}
					className="relative overflow-hidden db-spot-card"
					initial={{ opacity: 0, y: 28, filter: "blur(6px)" }}
					whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
					viewport={{ once: true }}
					transition={{
						duration: 0.5,
						delay: 0.08 + i * 0.07,
						ease: [0.22, 1, 0.36, 1],
					}}
				>
					{/* Spotlight border glow — positioned via CSS custom props */}
					<div className="db-spot-glow" />

					{/* Card content */}
					<div className="relative z-10 flex flex-col items-center gap-4 py-10 md:py-14 px-4 bg-[#08080d] m-[1px] rounded-[inherit]">
						<div className="w-14 h-14 md:w-16 md:h-16 rounded-xl border border-white/[0.05] bg-white/[0.02] flex items-center justify-center">
							<db.icon
								className="w-7 h-7 md:w-8 md:h-8 brightness-0 invert opacity-50"
								aria-hidden="true"
							/>
						</div>
						<span className="text-[11px] font-medium text-[#555] tracking-[0.14em] uppercase">
							{db.name}
						</span>
					</div>
				</motion.div>
			))}
		</div>
	);
}

export function DatabaseMarquee() {
	return (
		<section className="relative py-32 overflow-hidden">
			<div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

			<motion.div
				className="text-center mb-16 px-6"
				initial={{ opacity: 0, y: 20 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true }}
				transition={{ duration: 0.6 }}
			>
				<span className="inline-block text-[11px] font-mono uppercase tracking-[0.3em] text-[#555] mb-5">
					Integrations
				</span>
				<h2 className="text-[clamp(2rem,5vw,3.5rem)] font-bold tracking-[-0.03em] leading-[1.1] text-white mb-4">
					Every database you need
				</h2>
				<p className="text-[#555] text-base max-w-[460px] mx-auto leading-relaxed">
					First-class support for the databases that power your stack.
				</p>
			</motion.div>

			<div className="max-w-[820px] mx-auto px-6">
				<SpotlightGrid />
			</div>

			<style>{`
				.db-spot-card {
					border-radius: 16px;
					background: transparent;
				}

				/* The glow layer — a radial gradient positioned at the cursor */
				.db-spot-glow {
					position: absolute;
					inset: 0;
					border-radius: inherit;
					opacity: 0;
					background: radial-gradient(
						300px circle at var(--spot-x) var(--spot-y),
						rgba(56, 189, 248, 0.12),
						transparent 70%
					);
					z-index: 0;
					transition: opacity 0.4s ease;
					pointer-events: none;
				}

				/* Border glow via the card itself as a gradient background */
				.db-spot-card::before {
					content: "";
					position: absolute;
					inset: 0;
					border-radius: inherit;
					background: radial-gradient(
						400px circle at var(--spot-x) var(--spot-y),
						rgba(56, 189, 248, 0.25),
						transparent 60%
					);
					opacity: 0;
					transition: opacity 0.4s ease;
					z-index: 1;
					pointer-events: none;
				}

				.db-spotlight-grid:hover .db-spot-glow,
				.db-spotlight-grid:hover .db-spot-card::before {
					opacity: 1;
				}

				/* Mobile: subtle shimmer border instead of cursor tracking */
				@media (hover: none) {
					.db-spot-card::before {
						opacity: 0 !important;
					}
					.db-spot-glow {
						opacity: 0 !important;
					}
					.db-spot-card {
						background: rgba(255,255,255,0.03);
						border: 1px solid rgba(255,255,255,0.05);
					}
					.db-spot-card > div:last-child {
						margin: 0;
						background: transparent;
					}
				}

				@media (prefers-reduced-motion: reduce) {
					.db-spot-glow,
					.db-spot-card::before {
						transition: none !important;
					}
				}
			`}</style>
		</section>
	);
}
