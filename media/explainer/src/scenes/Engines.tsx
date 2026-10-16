import type React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ENGINES, EngineLogo } from "../components/EngineLogo";
import { Eyebrow, KineticText } from "../components/Kinetic";
import { keyed, mix, progress } from "../lib/anim";
import { colors, ease, fonts } from "../theme";

const ROW = 150;
const TICK_START = 28;
const TICK_EVERY = 13;
const TICK_DUR = 9;

/**
 * "Connect to [PostgreSQL]" with an iOS picker wheel that ticks through every
 * supported engine and lands on the last one.
 */
export const EnginesScene: React.FC = () => {
  const f = useCurrentFrame();
  const p = keyed(
    f,
    0,
    ENGINES.slice(1).map((_, i) => ({
      at: TICK_START + i * TICK_EVERY,
      dur: TICK_DUR,
      value: i + 1,
    })),
    ease.inOut,
  );
  const wheelIn = progress(f, 6, 26);
  const settle = progress(f, TICK_START + (ENGINES.length - 2) * TICK_EVERY + TICK_DUR, 14);

  return (
    <AbsoluteFill style={{ background: colors.canvas }}>
      <div style={{ position: "absolute", left: 170, top: 300 }}>
        <Eyebrow start={2}>Six engines, one app</Eyebrow>
      </div>

      <div
        style={{
          position: "absolute",
          left: 170,
          top: 0,
          height: 1080,
          display: "flex",
          alignItems: "center",
        }}
      >
        <KineticText
          start={4}
          content="Connect to"
          style={{
            fontFamily: fonts.sans,
            fontSize: 104,
            fontWeight: 600,
            letterSpacing: "-0.045em",
            color: colors.ink,
          }}
        />
      </div>

      {/* Picker wheel */}
      <div
        style={{
          position: "absolute",
          left: 780,
          top: 540 - 330,
          width: 1000,
          height: 660,
          perspective: 1400,
          opacity: wheelIn,
          translate: `0px ${mix(40, 0, wheelIn)}px`,
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, #000 30%, #000 70%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, #000 30%, #000 70%, transparent 100%)",
        }}
      >
        {/* Selection band */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 330 - ROW / 2,
            height: ROW,
            borderRadius: 32,
            background: colors.white,
            boxShadow: `0 1px 2px rgba(0,0,0,0.06), 0 12px 40px rgba(110,86,207,${mix(0.08, 0.2, settle)})`,
            outline: `2px solid rgba(110,86,207,${0.5 * settle})`,
          }}
        />
        {ENGINES.map((engine, i) => {
          const d = i - p;
          if (Math.abs(d) > 2.6) return null;
          const focus = Math.max(0, 1 - Math.abs(d));
          return (
            <div
              key={engine.id}
              style={{
                position: "absolute",
                left: 56,
                top: 330 - ROW / 2,
                height: ROW,
                display: "flex",
                alignItems: "center",
                gap: 32,
                translate: `0px ${d * ROW * 0.86}px`,
                rotate: `x ${-d * 26}deg`,
                opacity: Math.max(0, 1 - Math.abs(d) * 0.45),
                transformOrigin: "50% 50%",
              }}
            >
              <EngineLogo id={engine.id} size={92} color={focus > 0.5 ? engine.color : "#b8b8c0"} />
              <div
                style={{
                  fontFamily: fonts.sans,
                  fontSize: 104,
                  fontWeight: 600,
                  letterSpacing: "-0.045em",
                  color: focus > 0.5 ? colors.ink : "#a1a1aa",
                  whiteSpace: "nowrap",
                }}
              >
                {engine.name}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
