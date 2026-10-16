import type React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { KineticText, serifAccent } from "../components/Kinetic";
import { Lockup } from "../components/Lockup";
import { mix, progress } from "../lib/anim";
import { colors, ease, fonts } from "../theme";

/** Icon lands, slides left as the wordmark wipes in, then the tagline. */
export const LogoSting: React.FC = () => {
  const f = useCurrentFrame();
  const iconIn = progress(f, 2, 26);
  const slide = progress(f, 28, 26, ease.inOut);
  const reveal = progress(f, 36, 26);
  const glow = progress(f, 0, 60);

  return (
    <AbsoluteFill
      style={{ background: colors.black, alignItems: "center", justifyContent: "center" }}
    >
      <div
        style={{
          position: "absolute",
          width: 1400,
          height: 1400,
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(110,86,207,0.30), rgba(110,86,207,0.08) 50%, rgba(110,86,207,0) 100%)",
          opacity: glow,
          scale: `${mix(0.8, 1, glow)}`,
          translate: "0px -60px",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          translate: "0px -30px",
        }}
      >
        <Lockup
          slide={slide}
          reveal={reveal}
          iconStyle={{
            opacity: iconIn,
            scale: `${mix(0.88, 1, iconIn)}`,
            filter: iconIn < 1 ? `blur(${mix(14, 0, iconIn)}px)` : undefined,
          }}
        />
        <KineticText
          start={50}
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
    </AbsoluteFill>
  );
};
