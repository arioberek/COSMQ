import {
	Cable,
	type LucideIcon,
	ShieldCheck,
	Smartphone,
	SquareTerminal,
} from "lucide-react";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

interface Feature {
	title: string;
	description: string;
	Icon: LucideIcon;
	accent: string;
	gradient: string;
}

const features: Feature[] = [
	{
		title: "Direct TCP",
		description:
			"Connect directly to your database servers using native TCP sockets. No intermediate APIs, no proxy servers, no compromises.",
		Icon: Cable,
		accent: "#38bdf8",
		gradient: "from-[#38bdf8]/10 to-transparent",
	},
	{
		title: "Secure Storage",
		description:
			"Credentials never leave your device. Passwords are encrypted using your device's native secure enclave — Keychain on iOS, Keystore on Android.",
		Icon: ShieldCheck,
		accent: "#34d399",
		gradient: "from-[#34d399]/10 to-transparent",
	},
	{
		title: "Universal",
		description:
			"Built for iOS, Android, and Web. One consistent, high-performance interface across every device you own.",
		Icon: Smartphone,
		accent: "#60a5fa",
		gradient: "from-[#60a5fa]/10 to-transparent",
	},
	{
		title: "SQL Editor",
		description:
			"Full-featured SQL editor with syntax highlighting, history, and results visualization — optimized for mobile screens.",
		Icon: SquareTerminal,
		accent: "#c084fc",
		gradient: "from-[#c084fc]/10 to-transparent",
	},
];

function FeatureCard({
	feature,
	index,
}: { feature: Feature; index: number }) {
	const { Icon, title, description, accent } = feature;
	const num = String(index + 1).padStart(2, "0");
	const ref = useRef<HTMLDivElement>(null);

	const { scrollYProgress } = useScroll({
		target: ref,
		offset: ["start end", "center center"],
	});

	const y = useTransform(scrollYProgress, [0, 1], [60, 0]);
	const opacity = useTransform(scrollYProgress, [0, 0.6], [0, 1]);
	const scale = useTransform(scrollYProgress, [0, 1], [0.96, 1]);

	return (
		<motion.div
			ref={ref}
			style={{ y, opacity, scale }}
			className="group relative"
		>
			<div className="relative rounded-2xl border border-white/[0.05] bg-white/[0.02] p-8 md:p-10 overflow-hidden backdrop-blur-sm hover:border-white/[0.1] transition-colors duration-500">
				{/* Gradient glow on hover */}
				<div
					className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`}
				/>

				<div className="relative z-10">
					{/* Number + icon row */}
					<div className="flex items-start justify-between mb-8">
						<span
							className="text-[64px] md:text-[80px] font-black leading-none tracking-tighter"
							style={{ color: `${accent}10` }}
						>
							{num}
						</span>
						<motion.div
							whileHover={{ rotate: -8, scale: 1.1 }}
							transition={{ type: "spring", stiffness: 400, damping: 15 }}
							className="flex items-center justify-center w-14 h-14 rounded-2xl mt-2"
							style={{
								background: `${accent}12`,
								border: `1px solid ${accent}20`,
							}}
						>
							<Icon className="w-6 h-6" style={{ color: accent }} strokeWidth={1.5} />
						</motion.div>
					</div>

					<h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-3">
						{title}
					</h3>
					<p className="text-[15px] text-[#666] leading-[1.7] m-0 max-w-[400px]">
						{description}
					</p>
				</div>
			</div>
		</motion.div>
	);
}

export function FeaturesSection() {
	return (
		<section id="features" className="relative py-32 px-6 lg:px-10">
			<div className="max-w-[1400px] mx-auto">
				{/* Section header */}
				<div className="mb-20 max-w-[640px]">
					<motion.span
						initial={{ opacity: 0, x: -10 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.5 }}
						className="inline-block text-[11px] font-mono uppercase tracking-[0.3em] text-[#555] mb-5"
					>
						Features
					</motion.span>
					<motion.h2
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6, delay: 0.1 }}
						className="text-[clamp(2rem,5vw,3.5rem)] font-bold tracking-[-0.03em] leading-[1.1] text-white"
					>
						Built for engineers
						<span className="text-[#444]"> who ship from anywhere.</span>
					</motion.h2>
				</div>

				{/* Feature grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
					{features.map((feature, i) => (
						<FeatureCard key={feature.title} feature={feature} index={i} />
					))}
				</div>
			</div>
		</section>
	);
}
