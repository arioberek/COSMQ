import type React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Eyebrow, KineticText } from "../components/Kinetic";
import { EyeOffIcon, FaceIcon, KeyIcon } from "../components/phone-ui/icons";
import { mix, progress } from "../lib/anim";
import { colors, fonts } from "../theme";

const LINE: React.CSSProperties = {
  fontFamily: fonts.sans,
  fontSize: 84,
  fontWeight: 600,
  letterSpacing: "-0.04em",
  lineHeight: 1.05,
  color: colors.white,
};

const dim = { color: "#8d8d93" };

/** Three statements on black, each with its icon, staggered in. */
export const PrivacyScene: React.FC = () => {
  const f = useCurrentFrame();
  const rows = [
    {
      start: 14,
      Icon: KeyIcon,
      content: [{ t: "Passwords stay in your " }, { t: "Keychain.", style: dim }],
    },
    {
      start: 34,
      Icon: FaceIcon,
      content: [{ t: "Face ID lock, " }, { t: "if you want it.", style: dim }],
    },
    {
      start: 54,
      Icon: EyeOffIcon,
      content: [{ t: "No accounts. " }, { t: "No tracking.", style: dim }],
    },
  ];

  return (
    <AbsoluteFill style={{ background: colors.black }}>
      <div
        style={{
          position: "absolute",
          left: 170,
          top: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 48,
        }}
      >
        <Eyebrow start={4} color={colors.violetDark} style={{ marginBottom: 6 }}>
          Private by design
        </Eyebrow>
        {rows.map(({ start, Icon, content }) => {
          const p = progress(f, start, 20);
          return (
            <div key={start} style={{ display: "flex", alignItems: "center", gap: 40 }}>
              <div
                style={{
                  width: 104,
                  height: 104,
                  borderRadius: 28,
                  background: "rgba(149,133,242,0.14)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: p,
                  scale: `${mix(0.9, 1, p)}`,
                }}
              >
                <Icon size={54} color={colors.violetDark} strokeWidth={1.8} />
              </div>
              <KineticText start={start + 2} content={content} style={LINE} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
