import { motion } from "motion/react";

interface Feature {
	title: string;
	description: string;
	// A concrete detail from the app, set in mono. Replaces a decorative icon.
	spec: string;
}

const features: Feature[] = [
	{
		title: "Direct TCP",
		description:
			"COSMQ speaks each database's own wire protocol over a TCP socket. No proxy server, no REST gateway, nothing sitting between your phone and your data.",
		spec: ":5432  :3306  :26257  :27017",
	},
	{
		title: "Passwords stay on the device",
		description:
			"Passwords go into the system keychain: Keychain on iOS, Keystore on Android. Add a Face ID or fingerprint lock that kicks in after you leave the app.",
		spec: "expo-secure-store",
	},
	{
		title: "Hard to drop a table by accident",
		description:
			"UPDATE, DELETE, DROP, TRUNCATE and ALTER ask before they run. Open transactions can roll back on a timer, so nothing sits locked while your phone is in your pocket.",
		spec: "BEGIN … auto-rollback 10–600s",
	},
	{
		title: "An editor sized for thumbs",
		description:
			"Syntax highlighting, autocomplete that knows you're after FROM, keyword chips and searchable history. Built for a phone first, not shrunk down from a desktop IDE.",
		spec: "SELECT * FROM orders▍",
	},
];

function FeatureRow({ feature, index }: { feature: Feature; index: number }) {
	const { title, description, spec } = feature;
	const num = String(index + 1).padStart(2, "0");

	return (
		<motion.article
			initial={{ opacity: 0, y: 16 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "-80px" }}
			transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
			className="relative grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-10 pt-10 pb-12 md:pt-14 md:pb-16 border-t border-border"
		>
			<span className="md:col-span-1 font-mono text-[12px] tracking-[0.2em] text-foreground/45 tabular-nums md:pt-2">
				{num}
			</span>

			<h3 className="md:col-span-5 text-[clamp(1.5rem,3vw,2rem)] font-semibold tracking-[-0.025em] leading-[1.15] text-foreground">
				{title}
			</h3>

			<div className="md:col-span-6 flex flex-col gap-5 md:pt-1">
				<p className="text-[15px] md:text-base text-muted-foreground leading-[1.7] max-w-[34rem]">
					{description}
				</p>
				<code className="self-start font-mono text-[12px] md:text-[13px] text-[hsl(var(--accent))] bg-[hsl(var(--accent)/0.08)] px-2.5 py-1 rounded-[4px] whitespace-pre">
					{spec}
				</code>
			</div>
		</motion.article>
	);
}

export function FeaturesSection() {
	return (
		<section id="features" className="relative pt-24 pb-28 md:pt-32 md:pb-36 px-6 lg:px-10">
			<div className="max-w-[1280px] mx-auto">
				<motion.div
					className="mb-14 md:mb-20 max-w-[640px]"
					initial={{ opacity: 0, y: 12 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-80px" }}
					transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
				>
					<span className="eyebrow mb-6">
						<span className="eyebrow-num">01</span>
						<span className="eyebrow-rule" />
						<span>Why it works</span>
					</span>
					<h2 className="text-[clamp(2rem,5vw,3.25rem)] font-semibold tracking-[-0.035em] leading-[1.08] text-foreground">
						Four reasons it actually <span className="font-display font-normal">works</span> on a
						phone.
					</h2>
				</motion.div>

				<div className="border-b border-border">
					{features.map((feature, i) => (
						<FeatureRow key={feature.title} feature={feature} index={i} />
					))}
				</div>
			</div>
		</section>
	);
}
