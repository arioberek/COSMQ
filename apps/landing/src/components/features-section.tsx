import { Cable, type LucideIcon, ShieldCheck, Smartphone, SquareTerminal } from "lucide-react";
import { motion } from "motion/react";

interface Feature {
	title: string;
	description: string;
	Icon: LucideIcon;
	accent: string;
}

const features: Feature[] = [
	{
		title: "Direct TCP",
		description:
			"Native TCP sockets, straight to your database. No proxy server in front, no REST shim, no third-party in between.",
		Icon: Cable,
		accent: "hsl(var(--alien-1))",
	},
	{
		title: "Stays on device",
		description:
			"Credentials are encrypted with the platform secure enclave — Keychain on iOS, Keystore on Android. Nothing leaves your phone.",
		Icon: ShieldCheck,
		accent: "#34d399",
	},
	{
		title: "iOS, Android, Web",
		description:
			"One consistent client across every device you carry. Pick up a query on the train, finish it on the laptop.",
		Icon: Smartphone,
		accent: "#60a5fa",
	},
	{
		title: "SQL editor that fits a phone",
		description:
			"Syntax highlighting, history, results table — designed for thumbs first, not retrofitted from a desktop IDE.",
		Icon: SquareTerminal,
		accent: "hsl(var(--alien-3))",
	},
];

function FeatureRow({ feature, index }: { feature: Feature; index: number }) {
	const { Icon, title, description, accent } = feature;
	const num = String(index + 1).padStart(2, "0");

	return (
		<motion.article
			initial={{ opacity: 0, y: 24 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "-80px" }}
			transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
			className="relative grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 py-12 md:py-16 border-t border-border"
		>
			<div className="md:col-span-2 flex md:flex-col items-center md:items-start gap-4">
				<span className="font-mono text-[12px] tracking-[0.2em] text-foreground/50">{num}</span>
				<div
					className="flex items-center justify-center w-11 h-11 rounded-lg border"
					style={{
						background: `${accent.startsWith("hsl") ? accent.replace(")", " / 0.08)") : `${accent}15`}`,
						borderColor: `${accent.startsWith("hsl") ? accent.replace(")", " / 0.18)") : `${accent}26`}`,
					}}
				>
					<Icon className="w-[18px] h-[18px]" style={{ color: accent }} strokeWidth={1.6} />
				</div>
			</div>

			<h3 className="md:col-span-4 text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-[-0.02em] leading-[1.15] text-foreground">
				{title}
			</h3>

			<p className="md:col-span-6 text-[15px] md:text-base text-muted-foreground leading-[1.7] max-w-[520px]">
				{description}
			</p>
		</motion.article>
	);
}

export function FeaturesSection() {
	return (
		<section id="features" className="relative py-24 md:py-32 px-6 lg:px-10">
			<div className="max-w-[1280px] mx-auto">
				<div className="mb-16 md:mb-20 max-w-[640px]">
					<motion.span
						initial={{ opacity: 0 }}
						whileInView={{ opacity: 1 }}
						viewport={{ once: true }}
						transition={{ duration: 0.5 }}
						className="eyebrow mb-6"
					>
						<span className="eyebrow-num">01</span>
						<span className="eyebrow-rule" />
						<span>Why it works</span>
					</motion.span>
					<motion.h2
						initial={{ opacity: 0, y: 16 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6, delay: 0.1 }}
						className="text-[clamp(2rem,5vw,3.25rem)] font-bold tracking-[-0.03em] leading-[1.1] text-foreground"
					>
						Four reasons it actually <span className="font-display font-normal">works</span> on a
						phone.
					</motion.h2>
				</div>

				<div className="border-b border-border">
					{features.map((feature, i) => (
						<FeatureRow key={feature.title} feature={feature} index={i} />
					))}
				</div>
			</div>
		</section>
	);
}
