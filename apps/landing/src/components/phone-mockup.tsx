import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useCallback, useRef } from "react";
import { Iphone } from "./ui/iphone";
import Screenshot1 from "@/assets/screenshots/app/1.jpeg";

export function PhoneMockup() {
	const ref = useRef<HTMLDivElement>(null);
	const mouseX = useMotionValue(0);
	const mouseY = useMotionValue(0);

	const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), {
		stiffness: 120,
		damping: 20,
	});
	const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), {
		stiffness: 120,
		damping: 20,
	});

	const handleMouse = useCallback(
		(e: React.MouseEvent) => {
			const rect = ref.current?.getBoundingClientRect();
			if (!rect) return;
			mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
			mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
		},
		[mouseX, mouseY],
	);

	const handleLeave = useCallback(() => {
		mouseX.set(0);
		mouseY.set(0);
	}, [mouseX, mouseY]);

	return (
		<motion.div
			ref={ref}
			initial={{ opacity: 0, y: 60, scale: 0.9 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{
				duration: 1,
				delay: 0.4,
				ease: [0.22, 1, 0.36, 1],
			}}
			className="relative w-[220px] md:w-[260px]"
			style={{ perspective: 1200 }}
			onMouseMove={handleMouse}
			onMouseLeave={handleLeave}
		>
			<motion.div
				style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
			>
				{/* Float */}
				<motion.div
					animate={{ y: [0, -10, 0] }}
					transition={{
						duration: 6,
						repeat: Infinity,
						ease: "easeInOut",
					}}
				>
					<div className="relative drop-shadow-[0_40px_80px_rgba(0,0,0,0.8)] [filter:drop-shadow(0_0_60px_rgba(124,92,255,0.12))]">
						<Iphone
							src={Screenshot1.src}
							className="dark"
						/>
					</div>
				</motion.div>
			</motion.div>

			{/* Glow under phone */}
			<div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[70%] h-[30px] bg-[radial-gradient(ellipse,rgba(124,92,255,0.25)_0%,transparent_70%)] blur-lg pointer-events-none" />
		</motion.div>
	);
}
