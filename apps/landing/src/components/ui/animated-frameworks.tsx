import { memo, useEffect, useState } from "react"

import { cn } from "@/lib/utils"
import { Icons } from "@/components/icons"

type AnimatedFrameworksProps = {
  cardTitle?: string
  cardDescription?: string
}

const AnimatedFrameworks = ({
  cardTitle = "Database Support",
  cardDescription = "Connect to PostgreSQL, MySQL, MariaDB, SQLite, CockroachDB, MongoDB and more.",
}: AnimatedFrameworksProps) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden",
        "flex flex-col justify-between",
        "h-[26rem] space-y-4",
        "rounded-md border border-neutral-800/50 bg-[#171717] shadow-sm"
      )}
    >
      <FrameworkCard />
      <div className="px-4 pb-4">
        <div className="text-sm font-semibold text-white">
          {cardTitle}
        </div>
        <div className="mt-2 text-xs text-neutral-400">
          {cardDescription}
        </div>
      </div>
    </div>
  )
}

export default AnimatedFrameworks

type PathConfig = {
  id: string
  d: string
  duration: string
  direction: "normal" | "reverse"
  dashArray: string
}

const pathConfigs: PathConfig[] = [
  { id: "diagonal-tl-br", d: "M 0 10 Q 25 25 50 50 T 100 90", duration: "3s", direction: "normal", dashArray: "15 185" },
  { id: "diagonal-tr-bl", d: "M 100 5 Q 75 30 50 50 T 0 95", duration: "4s", direction: "reverse", dashArray: "20 180" },
  { id: "wave-top", d: "M 0 20 Q 25 10 50 20 T 100 20", duration: "2.5s", direction: "normal", dashArray: "12 188" },
  { id: "wave-bottom", d: "M 0 80 Q 25 90 50 80 T 100 80", duration: "5s", direction: "normal", dashArray: "18 182" },
  { id: "vertical-left", d: "M 15 0 Q 10 25 15 50 T 15 100", duration: "3.5s", direction: "reverse", dashArray: "10 190" },
  { id: "vertical-right", d: "M 85 100 Q 90 75 85 50 T 85 0", duration: "3s", direction: "normal", dashArray: "15 185" },
  { id: "cross-horizontal", d: "M 0 50 Q 25 45 50 50 T 100 50", duration: "2.5s", direction: "normal", dashArray: "12 188" },
  { id: "cross-vertical", d: "M 50 0 Q 45 25 50 50 T 50 100", duration: "4s", direction: "reverse", dashArray: "20 180" },
]

const gradientColors = ["#7c5cff", "#e040fb", "#9d85ff"]

const AnimatedPaths = memo(function AnimatedPaths() {
  return (
    <svg
      className="h-full w-full"
      viewBox="0 0 100 100"
      fill="none"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        {gradientColors.map((color, i) => (
          <linearGradient
            key={`gradient-${i + 1}`}
            id={`glow-gradient-${i + 1}`}
            x1={i === 1 ? "100%" : "0%"}
            y1={i === 2 ? "50%" : "0%"}
            x2={i === 1 ? "0%" : "100%"}
            y2={i === 2 ? "50%" : "100%"}
          >
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor={color} />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        ))}
      </defs>
      {pathConfigs.map((path) => (
        <path
          key={`bg-${path.id}`}
          d={path.d}
          stroke="#252525"
          strokeWidth="0.3"
          fill="none"
        />
      ))}
      {pathConfigs.map((path, index) => (
        <path
          key={`glow-${path.id}`}
          d={path.d}
          stroke={`url(#glow-gradient-${(index % 3) + 1})`}
          strokeWidth="0.6"
          strokeLinecap="round"
          fill="none"
          style={{
            strokeDasharray: path.dashArray,
            animation: `dash-${path.direction} ${path.duration} linear infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes dash-normal {
          from { stroke-dashoffset: 200; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes dash-reverse {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: 200; }
        }
      `}</style>
    </svg>
  )
})

const FrameworkCard = () => {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % 6)
    }, 1500)

    return () => clearInterval(interval)
  }, [])

  const cardClasses =
    "flex aspect-square items-center justify-center rounded-md border border-neutral-800 bg-gradient-to-b from-[#272727] to-[#3d3d3d] p-3 " +
    "shadow-[0_8px_30px_rgb(0,0,0,0.12)] " +
    "h-16 w-16 [@media(min-width:500px)]:h-20 [@media(min-width:500px)]:w-20 " +
    "transition-transform duration-700 ease-out will-change-transform"

  const getTransform = (index: number) => {
    return activeIndex === index
      ? "translateY(-4px) rotateX(10deg) translateZ(20px)"
      : "none"
  }

  const databases = [
    { icon: Icons.postgresql, label: "PostgreSQL" },
    { icon: Icons.mysql, label: "MySQL" },
    { icon: Icons.mariadb, label: "MariaDB" },
    { icon: Icons.sqlite, label: "SQLite" },
    { icon: Icons.cockroachdb, label: "CockroachDB" },
    { icon: Icons.mongodb, label: "MongoDB" },
  ]

  return (
    <div
      className={cn(
        "relative",
        "flex flex-col items-center justify-center gap-1",
        "h-[20rem] w-full"
      )}
    >
      <div className="absolute inset-0">
        <AnimatedPaths />
      </div>

      <div
        className={cn(
          "relative z-10",
          "flex flex-col items-center justify-center gap-3",
          "[perspective:1000px] [transform-style:preserve-3d]"
        )}
      >
        <div className="flex items-center justify-center gap-3">
          {databases.slice(0, 3).map((db, index) => (
            <div
              key={db.label}
              className={cardClasses}
              style={{ transform: getTransform(index) }}
            >
              <db.icon className="size-8 [@media(min-width:500px)]:size-10 brightness-0 invert" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-3">
          {databases.slice(3, 6).map((db, index) => (
            <div
              key={db.label}
              className={cardClasses}
              style={{ transform: getTransform(index + 3) }}
            >
              <db.icon className="size-8 [@media(min-width:500px)]:size-10 brightness-0 invert" />
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 z-20 h-3 w-full bg-gradient-to-t from-[#171717] to-transparent" />
    </div>
  )
}
