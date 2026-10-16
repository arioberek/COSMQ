import type React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { KineticText, serifAccent } from "../components/Kinetic";
import { Lockup } from "../components/Lockup";
import { mix, progress } from "../lib/anim";
import { colors, ease, fonts } from "../theme";

type EndCardProps = {
  /** Fade to black over the last frames (used by the looping teaser). */
  fadeOut?: boolean;
};

/** Closing lockup: icon + wordmark, tagline, and where to find the code. */
export const EndCard: React.FC<EndCardProps> = ({ fadeOut = false }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const lockIn = progress(f, 0, 26);
  const glow = progress(f, 0, 50);
  const meta = progress(f, 30, 20);
  const out = fadeOut ? progress(f, durationInFrames - 14, 14, ease.in) : 0;

  return (
    <AbsoluteFill
      style={{ background: colors.black, alignItems: "center", justifyContent: "center" }}
    >
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: 1 - out }}>
        <div
          style={{
            position: "absolute",
            width: 1400,
            height: 1400,
            borderRadius: "50%",
            background:
              "radial-gradient(closest-side, rgba(110,86,207,0.28), rgba(110,86,207,0.07) 50%, rgba(110,86,207,0) 100%)",
            opacity: glow,
            translate: "0px -80px",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            translate: "0px -50px",
          }}
        >
          <Lockup
            slide={1}
            reveal={1}
            style={{
              opacity: lockIn,
              translate: `0px ${mix(30, 0, lockIn)}px`,
              filter: lockIn < 1 ? `blur(${mix(10, 0, lockIn)}px)` : undefined,
            }}
          />
          <KineticText
            start={12}
            stagger={3}
            content={[
              { t: "Your databases, " },
              { t: "in your pocket.", style: { ...serifAccent(colors.violetDark), fontSize: 74 } },
            ]}
            style={{
              marginTop: 64,
              fontFamily: fonts.sans,
              fontSize: 66,
              fontWeight: 500,
              letterSpacing: "-0.03em",
              color: colors.white,
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 120,
            display: "flex",
            alignItems: "center",
            gap: 28,
            fontFamily: fonts.mono,
            fontSize: 34,
            color: colors.white,
            opacity: meta,
            translate: `0px ${mix(16, 0, meta)}px`,
          }}
        >
          <span
            style={{
              color: colors.violetDark,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontSize: 28,
            }}
          >
            Open source · MIT
          </span>
          <span style={{ width: 1.5, height: 34, background: "rgba(255,255,255,0.25)" }} />
          <span style={{ letterSpacing: "-0.01em" }}>github.com/arioberek/COSMQ</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
