import type React from "react";
import { Img, staticFile } from "remotion";
import { colors, fonts } from "../theme";

/** iPhone 15 Pro logical screen, in points. Screenshots are 3x (1179×2556). */
export const SCREEN_W = 393;
export const SCREEN_H = 852;
/** Screenshots start at the nav bar; this pushes them below the status bar. */
export const SAFE_TOP = 50;
const BEZEL = 13;
export const PHONE_W = SCREEN_W + BEZEL * 2;
export const PHONE_H = SCREEN_H + BEZEL * 2;

type PhoneProps = {
  children: React.ReactNode;
  dark?: boolean;
  style?: React.CSSProperties;
};

/**
 * A rounded iPhone body drawn in code: titanium rim, black bezel, Dynamic
 * Island, status bar and home indicator. Children render in screen points
 * (393×852); scale the whole phone from the outside.
 */
export const Phone: React.FC<PhoneProps> = ({ children, dark = false, style }) => {
  const ink = dark ? colors.white : colors.black;
  return (
    <div
      style={{
        position: "absolute",
        width: PHONE_W,
        height: PHONE_H,
        borderRadius: 68,
        background: "#1b1b1f",
        boxShadow: [
          "inset 0 0 0 1.5px #5d5d66", // titanium edge highlight
          "inset 0 0 0 4px #2a2a30",
          "0 2px 3px rgba(0,0,0,0.12)",
          "0 30px 60px -12px rgba(30, 20, 80, 0.30)",
          "0 60px 120px -30px rgba(30, 20, 80, 0.35)",
        ].join(", "),
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: BEZEL,
          top: BEZEL,
          width: SCREEN_W,
          height: SCREEN_H,
          borderRadius: 55,
          overflow: "hidden",
          background: dark ? colors.black : colors.canvas,
        }}
      >
        {children}
        <StatusBar color={ink} />
        {/* Dynamic Island */}
        <div
          style={{
            position: "absolute",
            left: (SCREEN_W - 124) / 2,
            top: 11,
            width: 124,
            height: 36,
            borderRadius: 18,
            background: "#000",
          }}
        />
        {/* Home indicator */}
        <div
          style={{
            position: "absolute",
            left: (SCREEN_W - 136) / 2,
            bottom: 8,
            width: 136,
            height: 5,
            borderRadius: 3,
            background: ink,
            opacity: 0.85,
          }}
        />
      </div>
    </div>
  );
};

const StatusBar: React.FC<{ color: string }> = ({ color }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      width: SCREEN_W,
      height: 54,
      color,
      fontFamily: fonts.ui,
    }}
  >
    <div
      style={{
        position: "absolute",
        left: 34,
        top: 17,
        width: 70,
        textAlign: "center",
        fontSize: 17,
        fontWeight: 600,
        letterSpacing: "-0.02em",
      }}
    >
      9:41
    </div>
    <svg
      width={78}
      height={14}
      viewBox="0 0 78 14"
      style={{ position: "absolute", right: 30, top: 22 }}
      fill={color}
    >
      {/* Cellular */}
      <rect x="0" y="9" width="3.2" height="4.5" rx="0.8" />
      <rect x="4.8" y="6.5" width="3.2" height="7" rx="0.8" />
      <rect x="9.6" y="4" width="3.2" height="9.5" rx="0.8" />
      <rect x="14.4" y="1.2" width="3.2" height="12.3" rx="0.8" />
      {/* Wi-Fi */}
      <path d="M31 3.2a11.5 11.5 0 0 1 8.2 3.4l1.3-1.3A13.3 13.3 0 0 0 31 1.4a13.3 13.3 0 0 0-9.5 3.9l1.3 1.3A11.5 11.5 0 0 1 31 3.2Z" />
      <path d="M31 7a7.6 7.6 0 0 1 5.4 2.2l1.3-1.3A9.4 9.4 0 0 0 31 5.2a9.4 9.4 0 0 0-6.7 2.7l1.3 1.3A7.6 7.6 0 0 1 31 7Z" />
      <path d="M31 10.6a3.4 3.4 0 0 1 2.6 1.1L31 14.3l-2.6-2.6a3.4 3.4 0 0 1 2.6-1.1Z" />
      {/* Battery */}
      <rect
        x="49"
        y="1.5"
        width="24"
        height="11.5"
        rx="3.6"
        fill="none"
        stroke={color}
        strokeOpacity="0.4"
        strokeWidth="1"
      />
      <rect x="51" y="3.5" width="18.5" height="7.5" rx="2" />
      <path d="M74.6 5.3v4a2.2 2.2 0 0 0 0-4Z" fillOpacity="0.45" />
    </svg>
  </div>
);

/** A full-screen app screenshot placed below the status bar. */
export const Screenshot: React.FC<{
  name: string;
  /** Show only the part below this y (screen points, before SAFE_TOP offset). */
  cropTop?: number;
  style?: React.CSSProperties;
}> = ({ name, cropTop = 0, style }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: SAFE_TOP + cropTop,
      width: SCREEN_W,
      height: SCREEN_H - SAFE_TOP - cropTop,
      overflow: "hidden",
      ...style,
    }}
  >
    <Img
      src={staticFile(`screens/${name}.png`)}
      style={{ position: "absolute", left: 0, top: -cropTop, width: SCREEN_W, height: SCREEN_H }}
    />
  </div>
);
