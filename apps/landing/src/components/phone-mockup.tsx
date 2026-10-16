import { motion } from "motion/react";
import phoneScreenshot from "@/assets/screenshots/app/1.jpeg";
import { Iphone } from "./ui/iphone";

export function PhoneMockup() {
	return (
		<motion.div
			initial={{ opacity: 0, y: 32 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{
				duration: 1,
				delay: 0.4,
				ease: [0.23, 1, 0.32, 1],
			}}
			className="relative w-[220px] md:w-[260px]"
		>
			<Iphone src={phoneScreenshot.src} />

			<div className="absolute -bottom-6 left-[10%] right-[10%] h-[40px] bg-[radial-gradient(ellipse,hsl(var(--accent)/0.14)_0%,transparent_70%)] blur-xl pointer-events-none" />
			<div className="absolute -bottom-4 left-[5%] right-[5%] h-[30px] bg-[radial-gradient(ellipse,hsl(var(--shadow-tint)/0.6)_0%,transparent_70%)] blur-lg pointer-events-none" />
		</motion.div>
	);
}
