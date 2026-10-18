import { Iphone } from "./ui/iphone";

/**
 * Frames the connection-list screenshot in an iPhone mockup with a CSS entrance.
 */
export function PhoneMockup({ src }: { src: string }) {
	return (
		// CSS entrance (`.hero-reveal`), so the phone is painted with the server
		// HTML instead of waiting for the hero island to hydrate.
		<div
			className="hero-reveal relative w-[220px] md:w-[260px]"
			style={{ animationDelay: "250ms" }}
		>
			<Iphone src={src} />

			<div className="absolute -bottom-6 left-[10%] right-[10%] h-[40px] bg-[radial-gradient(ellipse,hsl(var(--accent)/0.14)_0%,transparent_70%)] blur-xl pointer-events-none" />
			<div className="absolute -bottom-4 left-[5%] right-[5%] h-[30px] bg-[radial-gradient(ellipse,hsl(var(--shadow-tint)/0.6)_0%,transparent_70%)] blur-lg pointer-events-none" />
		</div>
	);
}
