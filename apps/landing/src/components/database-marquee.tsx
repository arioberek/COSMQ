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

/**
 * Displays supported databases in a looping track with a separate screen reader list.
 */
export function DatabaseMarquee() {
	return (
		<section id="databases" className="relative pt-20 pb-24 md:pt-24 md:pb-32 overflow-hidden">
			<div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-px bg-gradient-to-r from-transparent via-border to-transparent" />

			<motion.div
				className="text-center mb-14 md:mb-16 px-6"
				initial={{ opacity: 0, y: 12 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true, margin: "-80px" }}
				transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
			>
				<span className="eyebrow mb-6 justify-center">
					<span className="eyebrow-num">03</span>
					<span className="eyebrow-rule" />
					<span>Databases</span>
				</span>
				<h2 className="text-[clamp(2rem,5vw,3.25rem)] font-semibold tracking-[-0.035em] leading-[1.08] text-foreground mb-4">
					Talks to <span className="font-display font-normal">your stack.</span>
				</h2>
				<p className="text-muted-foreground text-base max-w-[30rem] mx-auto leading-relaxed">
					Paste the connection string you already use. COSMQ handles the protocol.
				</p>
			</motion.div>

			<ul className="sr-only">
				{databases.map((db) => (
					<li key={db.name}>{db.name}</li>
				))}
			</ul>

			{/* Visual loop only; the list above is what assistive tech reads. */}
			<div className="db-marquee-mask" aria-hidden="true">
				<ul className="db-marquee-track">
					{track.map((db, i) => (
						<li key={`${db.name}-${i}`} className="db-marquee-item">
							<div className="db-marquee-icon">
								<db.icon
									className="w-7 h-7 md:w-8 md:h-8 brightness-0 invert opacity-70"
									width={32}
									height={32}
									alt=""
								/>
							</div>
							<span className="text-[15px] md:text-base font-medium tracking-[-0.01em] text-muted-foreground whitespace-nowrap">
								{db.name}
							</span>
						</li>
					))}
				</ul>
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
