"use client";

import {
  Cable,
  type LucideIcon,
  ShieldCheck,
  Smartphone,
  SquareTerminal,
} from "lucide-react";
import { motion, type Variants } from "motion/react";

interface Feature {
  title: string;
  description: string;
  Icon: LucideIcon;
  className?: string;
}

const features: Feature[] = [
  {
    title: "Direct TCP Connections",
    description:
      "Connect directly to your database servers using native TCP sockets. No intermediate APIs or proxy servers required.",
    Icon: Cable,
    className: "md:col-span-2 md:row-span-1",
  },
  {
    title: "Secure Storage",
    description:
      "Your credentials never leave your device. Passwords are encrypted using the device's native secure enclave (Keychain/Keystore).",
    Icon: ShieldCheck,
    className: "md:col-span-1 md:row-span-2",
  },
  {
    title: "Universal Support",
    description:
      "Built for iOS, Android, and Web. Experience a consistent, high-performance interface across all your devices.",
    Icon: Smartphone,
    className: "md:col-span-1 md:row-span-1",
  },
  {
    title: "SQL Editor",
    description:
      "Full-featured SQL editor with syntax highlighting, history, and results visualization optimized for mobile screens.",
    Icon: SquareTerminal,
    className: "md:col-span-1 md:row-span-1",
  },
];

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const FeatureCard = ({ feature }: { feature: Feature }) => {
  const { Icon, title, description, className } = feature;

  return (
    <motion.div
      className={`group relative flex h-full flex-col gap-4 rounded-2xl border border-white/[0.08] bg-[#13131a] p-6 transition-all duration-300 hover:border-[#7c5cff] hover:shadow-[0_8px_30px_rgba(124,92,255,0.15)] ${className}`}
      variants={fadeInUp}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#7c5cff]/20 to-[#e040fb]/10 ring-1 ring-white/[0.08]">
        <Icon className="h-6 w-6 text-[#9d85ff]" />
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <h3 className="text-lg font-semibold text-[#f0f0f5] tracking-tight">
          {title}
        </h3>
        <p className="text-sm text-[#b8b8c8] leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
};

export function FeaturesSection() {
  return (
    <section id="features" className="py-16 px-6 max-w-[1000px] mx-auto">
      <motion.h2
        className="text-center text-4xl font-bold mb-12 text-[#f0f0f5]"
        initial={{ opacity: 0, y: -10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        Everything you need
      </motion.h2>
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[minmax(180px,auto)]"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
      >
        {features.map((feature) => (
          <FeatureCard key={feature.title} feature={feature} />
        ))}
      </motion.div>
    </section>
  );
}
