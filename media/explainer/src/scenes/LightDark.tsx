import type React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Eyebrow } from "../components/Kinetic";
import { PHONE_H, PHONE_W, Phone, Screenshot } from "../components/Phone";
import { keyed, mix, progress } from "../lib/anim";
import { colors, ease, fonts } from "../theme";

const SCALE = 0.98;

/**
 * One phone, two themes: a vertical split sweeps in, holds on a half-light,
 * half-dark phone, then wipes everything to black for the next scene.
 */
export const LightDarkScene: React.FC = () => {
  const f = useCurrentFrame();
  // Left edge of the dark layer, in px.
  const split = keyed(
    f,
    1920,
    [
      { at: 10, dur: 26, value: 960 },
      { at: 78, dur: 22, value: 0 },
    ],
    ease.inOut,
  );
  const enter = progress(f, 0, 26);
  const outro = progress(f, 96, 14, ease.in);
  const labelIn = progress(f, 28, 18);

  const phone = (dark: boolean) => (
    <div
      style={{
        position: "absolute",
        left: 960 - (PHONE_W * SCALE) / 2,
        top: 540 - (PHONE_H * SCALE) / 2 + 10,
        width: PHONE_W,
        height: PHONE_H,
        transformOrigin: "0 0",
        scale: `${SCALE * mix(1, 0.94, outro)}`,
        translate: `${mix(0, (PHONE_W * SCALE * 0.06) / 2, outro)}px ${mix(60, 0, enter)}px`,
        opacity: enter * (1 - outro),
      }}
    >
      <Phone dark={dark}>
        <Screenshot name={dark ? "results-cards-dark" : "results-cards-light"} />
      </Phone>
    </div>
  );

  const label = (text: string, color: string, side: "left" | "right") => (
    <div
      style={{
        position: "absolute",
        top: 540 - 70,
        [side]: 170,
        fontFamily: fonts.sans,
        fontSize: 128,
        fontWeight: 600,
        letterSpacing: "-0.05em",
        color,
        opacity: labelIn * (1 - outro),
        translate: `${mix(side === "left" ? -24 : 24, 0, labelIn)}px 0px`,
      }}
    >
      {text}
    </div>
  );

  return (
    <AbsoluteFill>
      {/* Light layer */}
      <AbsoluteFill style={{ background: colors.canvas }}>
        {label("Light", colors.ink, "left")}
        <div style={{ position: "absolute", left: 170, top: 400 }}>
          <Eyebrow start={20} exitAt={74}>
            Appearance
          </Eyebrow>
        </div>
        {phone(false)}
      </AbsoluteFill>

      {/* Dark layer, revealed from the right */}
      <AbsoluteFill style={{ background: colors.black, clipPath: `inset(0 0 0 ${split}px)` }}>
        {label("Dark", colors.white, "right")}
        <div
          style={{
            position: "absolute",
            right: 170,
            top: 650,
            fontFamily: fonts.mono,
            fontSize: 26,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: colors.violetDark,
            opacity: progress(f, 36, 16) * (1 - progress(f, 70, 8)),
          }}
        >
          or follow the system
        </div>
        {phone(true)}
      </AbsoluteFill>

      {/* The seam */}
      {split > 0 && split < 1920 ? (
        <div
          style={{
            position: "absolute",
            left: split - 1,
            top: 0,
            width: 2,
            height: 1080,
            background: colors.violetDark,
            boxShadow: "0 0 24px 4px rgba(149,133,242,0.55)",
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
