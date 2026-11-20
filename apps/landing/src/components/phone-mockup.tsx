import { type MotionValue, motion, useSpring, useTransform } from "motion/react";
import { Iphone } from "./ui/iphone";

// Same spring as the hero's magnetic button, so both follow the pointer alike.
const SPRING = { stiffness: 300, damping: 20 };
const MAX_TILT_DEG = 5;

interface PhoneMockupProps {
	src: string;
	/** Pointer position across the hero, -1 to 1. */
	pointerX: MotionValue<number>;
	pointerY: MotionValue<number>;
}

/**
 * Frames the query screenshot in an iPhone mockup that leans a few degrees toward the pointer.
 */
export function PhoneMockup({ src, pointerX, pointerY }: PhoneMockupProps) {
	const rotateY = useSpring(
		useTransform(pointerX, (v) => v * MAX_TILT_DEG),
		SPRING,
	);
	const rotateX = useSpring(
		useTransform(pointerY, (v) => v * -MAX_TILT_DEG),
		SPRING,
	);

	return (
		// CSS entrance (`.hero-reveal`), so the phone is painted with the server
		// HTML instead of waiting for the hero island to hydrate. The tilt lives on
		// an inner element because the entrance animates this one's transform.
		<div
			className="hero-reveal relative w-[220px] md:w-[260px] [perspective:1200px]"
			style={{ animationDelay: "250ms" }}
		>
			<motion.div style={{ rotateX, rotateY }}>
				<Iphone src={src} />
			</motion.div>

			<div className="absolute -bottom-6 left-[10%] right-[10%] h-[40px] bg-[radial-gradient(ellipse,hsl(var(--accent)/0.14)_0%,transparent_70%)] blur-xl pointer-events-none" />
			<div className="absolute -bottom-4 left-[5%] right-[5%] h-[30px] bg-[radial-gradient(ellipse,hsl(var(--shadow-tint)/0.6)_0%,transparent_70%)] blur-lg pointer-events-none" />
		</div>
	);
}
