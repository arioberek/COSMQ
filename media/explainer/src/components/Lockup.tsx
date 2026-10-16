import type React from "react";
import { mix } from "../lib/anim";
import { colors, fonts } from "../theme";
import { AppIcon } from "./EngineLogo";

export const ICON = 176;
const GAP = 44;
/** Fixed wordmark box so the lockup centers without measuring text. */
export const WORDMARK_W = 690;
export const LOCKUP_W = ICON + GAP + WORDMARK_W;

type LockupProps = {
  /** 0 = icon alone in the center, 1 = icon in its lockup position. */
  slide: number;
  /** Wordmark reveal 0..1 (left-to-right clip). */
  reveal: number;
  iconStyle?: React.CSSProperties;
  style?: React.CSSProperties;
};

/** App icon + "COSMQ" wordmark. The icon starts centered and slides into place. */
export const Lockup: React.FC<LockupProps> = ({ slide, reveal, iconStyle, style }) => {
  // Offset that puts the icon at the frame's center when slide = 0.
  const centerOffset = LOCKUP_W / 2 - ICON / 2;
  return (
    <div style={{ position: "relative", width: LOCKUP_W, height: ICON, ...style }}>
      <div
        style={{
          position: "absolute",
          left: ICON + GAP,
          top: 0,
          height: ICON,
          width: WORDMARK_W,
          display: "flex",
          alignItems: "center",
          fontFamily: fonts.sans,
          fontWeight: 700,
          fontSize: 190,
          letterSpacing: "-0.055em",
          color: colors.white,
          clipPath: `inset(-20% ${mix(100, -5, reveal)}% -20% -5%)`,
          translate: `${mix(-60, 0, reveal)}px 0px`,
        }}
      >
        COSMQ
      </div>
      <AppIcon
        size={ICON}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          translate: `${mix(centerOffset, 0, slide)}px 0px`,
          boxShadow: "0 20px 60px rgba(110, 86, 207, 0.45)",
          ...iconStyle,
        }}
      />
    </div>
  );
};
