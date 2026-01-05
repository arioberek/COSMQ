import { useEffect, useState } from "react"

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
        "relative",
        "flex flex-col justify-between",
        "h-[26rem] space-y-4",
        "rounded-md border border-neutral-800/50 bg-[#171717] shadow-sm"
      )}
    >
      <style>{`
        @keyframes dash {
          0% {
            stroke-dashoffset: 200;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
        .animated-path {
          stroke-dasharray: 15 185;
          animation: dash 3s linear infinite;
        }
      `}</style>
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

  const pathD = "M 1 0 v 5 q 0 5 5 5 h 39 q 5 0 5 5 v 71 q 0 5 5 5 h 39 q 5 0 5 5 v 5"

  return (
    <div
      className={cn(
        "relative",
        "flex flex-col items-center justify-center gap-1",
        "h-[20rem] w-full"
      )}
    >
      <div className="absolute flex h-full w-full items-center justify-center">
        <div className="h-full w-[18rem]">
          <svg
            className="h-full w-full"
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            fill="none"
            aria-hidden="true"
          >
            <path
              d={pathD}
              stroke="#333"
              strokeWidth="0.3"
              fill="none"
            />
            <path
              d={pathD}
              stroke="url(#glow-gradient)"
              strokeWidth="0.8"
              strokeLinecap="round"
              fill="none"
              className="animated-path"
            />
            <defs>
              <linearGradient id="glow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="50%" stopColor="#7c5cff" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      <div
        className={cn(
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

      <div className="absolute bottom-0 left-0 h-3 w-full bg-gradient-to-t from-[#171717] to-transparent" />
    </div>
  )
}
