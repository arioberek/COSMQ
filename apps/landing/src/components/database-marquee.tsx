import { motion } from "motion/react";
import { Icons } from "./icons";

const databases = [
	{ icon: Icons.postgresql, name: "PostgreSQL" },
	{ icon: Icons.mysql, name: "MySQL" },
	{ icon: Icons.mariadb, name: "MariaDB" },
	{ icon: Icons.sqlite, name: "SQLite" },
	{ icon: Icons.cockroachdb, name: "CockroachDB" },
	{ icon: Icons.mongodb, name: "MongoDB" },
];

export function DatabaseMarquee() {
	const items = [...databases, ...databases, ...databases];

	return (
		<section className="relative py-32 overflow-hidden">
			{/* Top divider line */}
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

			{/* Marquee */}
			<div className="overflow-hidden relative group">
				<div className="absolute left-0 top-0 bottom-0 w-24 md:w-48 bg-gradient-to-r from-[#06060a] to-transparent z-10 pointer-events-none" />
				<div className="absolute right-0 top-0 bottom-0 w-24 md:w-48 bg-gradient-to-l from-[#06060a] to-transparent z-10 pointer-events-none" />

				<div className="flex gap-4 md:gap-6 w-max group-hover:[animation-play-state:paused] marquee-track">
					{items.map((db, i) => (
						<div
							key={`${db.name}-${i}`}
							className="flex items-center gap-3 px-6 py-4 rounded-2xl border border-white/[0.04] bg-white/[0.02] hover:border-[#7c5cff]/20 hover:bg-[#7c5cff]/[0.03] transition-all duration-500 shrink-0 backdrop-blur-sm"
						>
							<db.icon
								className="w-8 h-8 brightness-0 invert opacity-60 group-hover:opacity-80 transition-opacity duration-300"
								aria-hidden="true"
							/>
							<span className="text-sm font-medium text-[#888] whitespace-nowrap tracking-wide">
								{db.name}
							</span>
						</div>
					))}
				</div>
			</div>

			<style>{`
				@media (prefers-reduced-motion: reduce) {
					.marquee-track { animation: none !important; }
				}
			`}</style>
		</section>
	);
}
