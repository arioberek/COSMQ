import { motion } from "motion/react";
import { Icons } from "./icons";

const databases = [
	{ icon: Icons.postgresql, name: "PostgreSQL" },
	{ icon: Icons.mysql, name: "MySQL" },
	{ icon: Icons.mongodb, name: "MongoDB" },
	{ icon: Icons.sqlite, name: "SQLite" },
	{ icon: Icons.cockroachdb, name: "CockroachDB" },
	{ icon: Icons.mariadb, name: "MariaDB" },
];

// Duplicated track for seamless infinite loop.
const track = [...databases, ...databases];

export function DatabaseMarquee() {
	return (
		<section className="relative py-24 md:py-32 overflow-hidden">
			<div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-px bg-gradient-to-r from-transparent via-border to-transparent" />

			<motion.div
				className="text-center mb-14 md:mb-16 px-6"
				initial={{ opacity: 0, y: 16 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true }}
				transition={{ duration: 0.6 }}
			>
				<span className="eyebrow mb-6 justify-center">
					<span className="eyebrow-num">03</span>
					<span className="eyebrow-rule" />
					<span>Databases</span>
				</span>
				<h2 className="text-[clamp(2rem,5vw,3.25rem)] font-bold tracking-[-0.03em] leading-[1.1] text-foreground mb-4">
					Talks to <span className="font-display font-normal">your stack.</span>
				</h2>
				<p className="text-muted-foreground text-base max-w-[460px] mx-auto leading-relaxed">
					First-class support for the databases that already run your app.
				</p>
			</motion.div>

			<div className="db-marquee-mask">
				<div className="db-marquee-track" aria-hidden="false" role="list">
					{track.map((db, i) => (
						<div key={`${db.name}-${i}`} role="listitem" className="db-marquee-item">
							<div className="db-marquee-icon">
								<db.icon
									className="w-7 h-7 md:w-8 md:h-8 brightness-0 invert opacity-70"
									width={32}
									height={32}
									alt=""
								/>
							</div>
							<span className="font-mono text-[12px] md:text-[13px] tracking-[0.16em] uppercase text-muted-foreground whitespace-nowrap">
								{db.name}
							</span>
						</div>
					))}
				</div>
			</div>

			<style>{`
				.db-marquee-mask {
					position: relative;
					overflow: hidden;
					-webkit-mask-image: linear-gradient(to right, transparent 0, black 80px, black calc(100% - 80px), transparent 100%);
					        mask-image: linear-gradient(to right, transparent 0, black 80px, black calc(100% - 80px), transparent 100%);
				}

				.db-marquee-track {
					display: flex;
					gap: 3rem;
					width: max-content;
					padding: 0.5rem 0;
					animation: db-marquee 32s linear infinite;
					will-change: transform;
				}
				.db-marquee-mask:hover .db-marquee-track {
					animation-play-state: paused;
				}

				@keyframes db-marquee {
					from { transform: translateX(0); }
					to   { transform: translateX(-50%); }
				}

				.db-marquee-item {
					display: inline-flex;
					align-items: center;
					gap: 0.875rem;
					padding: 0.5rem 1rem;
					flex-shrink: 0;
				}

				.db-marquee-icon {
					display: inline-flex;
					align-items: center;
					justify-content: center;
					width: 44px;
					height: 44px;
					border-radius: 12px;
					background: hsl(var(--surface-1));
					border: 1px solid hsl(var(--border));
					flex-shrink: 0;
				}

				@media (min-width: 768px) {
					.db-marquee-icon {
						width: 52px;
						height: 52px;
					}
					.db-marquee-track {
						gap: 4rem;
					}
				}

				@media (prefers-reduced-motion: reduce) {
					.db-marquee-track {
						animation: none;
						transform: translateX(0);
					}
				}
			`}</style>
		</section>
	);
}
