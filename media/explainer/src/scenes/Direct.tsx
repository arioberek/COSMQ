import type React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { AppIcon, ENGINES, EngineLogo } from "../components/EngineLogo";
import { Eyebrow, KineticText, serifAccent } from "../components/Kinetic";
import { mix, progress } from "../lib/anim";
import { colors, fonts } from "../theme";

const PHONE = { x: 1120, y: 540, w: 156, h: 316 };
const TILE = 92;
const TILE_GAP = 22;
const TILES_X = 1660;
const tileY = (i: number) =>
  540 - ((ENGINES.length - 1) * (TILE + TILE_GAP)) / 2 + i * (TILE + TILE_GAP);

type Pt = { x: number; y: number };
const curve = (i: number): [Pt, Pt, Pt, Pt] => {
  const a = { x: PHONE.x + PHONE.w / 2 + 6, y: PHONE.y };
  const b = { x: TILES_X - TILE / 2 - 14, y: tileY(i) };
  return [a, { x: a.x + 170, y: a.y }, { x: b.x - 170, y: b.y }, b];
};
const bezier = ([p0, p1, p2, p3]: [Pt, Pt, Pt, Pt], t: number): Pt => {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
};
const pathD = ([p0, p1, p2, p3]: [Pt, Pt, Pt, Pt]) =>
  `M${p0.x} ${p0.y} C${p1.x} ${p1.y} ${p2.x} ${p2.y} ${p3.x} ${p3.y}`;

/** Phone → each database, drawn as direct lines with packets: no middle box. */
export const DirectScene: React.FC = () => {
  const f = useCurrentFrame();
  const phoneIn = progress(f, 6, 24);

  return (
    <AbsoluteFill style={{ background: colors.canvas }}>
      <div
        style={{
          position: "absolute",
          left: 150,
          top: 0,
          bottom: 0,
          width: 760,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Eyebrow start={0} style={{ marginBottom: 34 }}>
          Direct connection
        </Eyebrow>
        <KineticText
          start={4}
          content={[
            { t: "Straight to your " },
            { t: "database.", style: serifAccent(colors.violet) },
          ]}
          style={{
            fontFamily: fonts.sans,
            fontSize: 88,
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.02,
            color: colors.ink,
          }}
        />
        <KineticText
          start={16}
          stagger={1.5}
          rise={16}
          blur={4}
          content="Native wire protocols, over plain TCP."
          style={{
            fontFamily: fonts.sans,
            fontSize: 38,
            letterSpacing: "-0.015em",
            lineHeight: 1.3,
            color: colors.secondary,
            marginTop: 30,
            maxWidth: 640,
          }}
        />
        <div
          style={{
            marginTop: 40,
            display: "flex",
            gap: 14,
            opacity: progress(f, 40, 18),
            translate: `0px ${mix(14, 0, progress(f, 40, 18))}px`,
          }}
        >
          {["No proxy", "No gateway", "No middleman"].map((label) => (
            <div
              key={label}
              style={{
                fontFamily: fonts.mono,
                fontSize: 24,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: colors.violet,
                padding: "10px 18px",
                borderRadius: 999,
                background: "rgba(110,86,207,0.10)",
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {ENGINES.map((engine, i) => {
          const c = curve(i);
          const draw = progress(f, 20 + i * 3, 26);
          return (
            <path
              key={engine.id}
              d={pathD(c)}
              pathLength={1}
              fill="none"
              stroke={colors.violet}
              strokeOpacity={0.35}
              strokeWidth={2.5}
              strokeDasharray="1 1"
              strokeDashoffset={1 - draw}
            />
          );
        })}
        {ENGINES.map((engine, i) => {
          const live = progress(f, 44 + i * 3, 10);
          if (live <= 0) return null;
          const c = curve(i);
          return [0, 0.5].map((offset) => {
            const t = ((f - 44) / 34 + offset + i * 0.13) % 1;
            const pt = bezier(c, offset === 0 ? t : 1 - t);
            const edge = Math.min(1, t * 6, (1 - t) * 6);
            return (
              <circle
                key={`${engine.id}-${offset}`}
                cx={pt.x}
                cy={pt.y}
                r={offset === 0 ? 6 : 4.5}
                fill={colors.violet}
                opacity={live * edge * (offset === 0 ? 1 : 0.55)}
              />
            );
          });
        })}
      </svg>

      {/* Mini phone */}
      <div
        style={{
          position: "absolute",
          left: PHONE.x - PHONE.w / 2,
          top: PHONE.y - PHONE.h / 2,
          width: PHONE.w,
          height: PHONE.h,
          borderRadius: 34,
          background: "#1b1b1f",
          boxShadow: "inset 0 0 0 1.5px #5d5d66, 0 24px 50px -10px rgba(30,20,80,0.35)",
          opacity: phoneIn,
          translate: `0px ${mix(30, 0, phoneIn)}px`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 7,
            borderRadius: 28,
            background: colors.canvas,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AppIcon size={68} />
        </div>
        <div
          style={{
            position: "absolute",
            left: PHONE.w / 2 - 22,
            top: 15,
            width: 44,
            height: 12,
            borderRadius: 6,
            background: "#000",
          }}
        />
      </div>

      {ENGINES.map((engine, i) => {
        const p = progress(f, 30 + i * 3, 20);
        return (
          <div
            key={engine.id}
            style={{
              position: "absolute",
              left: TILES_X - TILE / 2,
              top: tileY(i) - TILE / 2,
              width: TILE,
              height: TILE,
              borderRadius: 24,
              background: colors.white,
              boxShadow: "0 1px 2px rgba(0,0,0,0.06), 0 10px 24px rgba(30,20,80,0.10)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: p,
              scale: `${mix(0.9, 1, p)}`,
            }}
          >
            <EngineLogo id={engine.id} size={52} color={engine.color} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
