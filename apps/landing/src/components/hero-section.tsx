import { motion } from "motion/react";
import FullLogo from "../assets/logos/full-logo.svg";

export const HeroSection = () => {
	return (
		<section className="pt-24 md:pt-32 pb-24 px-6 relative overflow-hidden">
			<div className="relative z-10 max-w-[1200px] mx-auto grid lg:grid-cols-2 gap-12 items-center">
				<div className="text-center lg:text-left flex flex-col items-center lg:items-start">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, ease: "easeOut" }}
						className="inline-block bg-[rgba(124,92,255,0.1)] text-[#9d85ff] px-4 py-2 rounded-full text-sm font-medium mb-6 border border-[rgba(124,92,255,0.2)]"
					>
						Open Source Mobile Database Client
					</motion.div>

					<motion.h1
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
						className="text-4xl md:text-[3.5rem] leading-[1.1] mb-6 font-bold tracking-tight"
					>
						Manage your databases <br />{" "}
						<span className="bg-gradient-to-br from-[#7c5cff] to-[#e040fb] bg-clip-text text-transparent">
							from anywhere
						</span>
					</motion.h1>

					<motion.p
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
						className="text-xl text-[#b8b8c8] max-w-[600px] lg:max-w-none mx-auto lg:mx-0 mb-10 leading-relaxed"
					>
						COSMQ brings professional database management to your phone. Connect
						directly via TCP, execute queries, and visualize results with native
						performance.
					</motion.p>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
						className="flex gap-4 justify-center lg:justify-start"
					>
						<a
							href="https://github.com/arioberek/COSMQ"
							className="px-6 py-3 rounded-xl font-semibold no-underline transition-all duration-200 bg-[#7c5cff] text-white shadow-[0_4px_14px_rgba(124,92,255,0.3)] hover:bg-[#9d85ff] hover:-translate-y-0.5"
						>
							View on GitHub
						</a>
						<a
							href="#features"
							className="px-6 py-3 rounded-xl font-semibold no-underline transition-all duration-200 bg-[#1a1a24] text-[#f0f0f5] border border-white/[0.08] hover:bg-[#13131a] hover:border-[#b8b8c8]"
						>
							Learn More
						</a>
					</motion.div>
				</div>

				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
					className="flex justify-center lg:justify-end"
				>
					<img
						src={FullLogo.src}
						alt="COSMQ Logo"
						width={FullLogo.width}
						height={FullLogo.height}
						className="w-full max-w-[500px] h-auto brightness-0 invert opacity-90 drop-shadow-[0_0_80px_rgba(124,92,255,0.3)]"
					/>
				</motion.div>
			</div>

			{/* Background Glow */}
			<motion.div
				initial={{ opacity: 0, scale: 0.8 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 1, delay: 0.1, ease: "easeOut" }}
				className="absolute w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(124,92,255,0.15)_0%,rgba(0,0,0,0)_70%)] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 pointer-events-none"
			/>
		</section>
	);
};
