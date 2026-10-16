import type React from "react";
import { AbsoluteFill } from "remotion";
import { AppIcon, ENGINES, EngineLogo } from "./components/EngineLogo";
import { serifAccent } from "./components/Kinetic";
import { PHONE_W, Phone, Screenshot } from "./components/Phone";
import { colors, fonts } from "./theme";

/** 1920×1080 poster frame for the video (and a social card). */
export const Poster: React.FC = () => (
  <AbsoluteFill style={{ background: colors.black, overflow: "hidden" }}>
    <div
      style={{
        position: "absolute",
        left: 1420 - 800,
        top: -260,
        width: 1600,
        height: 1600,
        borderRadius: "50%",
        background:
          "radial-gradient(closest-side, rgba(110,86,207,0.32), rgba(110,86,207,0.08) 55%, rgba(110,86,207,0) 100%)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 150,
        top: 0,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
        <AppIcon size={132} style={{ boxShadow: "0 18px 50px rgba(110,86,207,0.45)" }} />
        <div
          style={{
            fontFamily: fonts.sans,
            fontWeight: 700,
            fontSize: 150,
            letterSpacing: "-0.055em",
            color: colors.white,
          }}
        >
          COSMQ
        </div>
      </div>
      <div
        style={{
          marginTop: 56,
          fontFamily: fonts.sans,
          fontSize: 72,
          fontWeight: 500,
          letterSpacing: "-0.035em",
          lineHeight: 1.08,
          color: colors.white,
        }}
      >
        Your databases,
        <br />
        <span style={{ ...serifAccent(colors.violetDark), fontSize: 82 }}>in your pocket.</span>
      </div>
      <div style={{ marginTop: 64, display: "flex", gap: 30, alignItems: "center" }}>
        {ENGINES.map((e) => (
          <EngineLogo key={e.id} id={e.id} size={50} color="rgba(255,255,255,0.78)" />
        ))}
      </div>
      <div
        style={{
          marginTop: 40,
          fontFamily: fonts.mono,
          fontSize: 28,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: colors.violetDark,
        }}
      >
        Open source · MIT · iOS & Android
      </div>
    </div>
    <div
      style={{
        position: "absolute",
        left: 1420 - (PHONE_W * 1.12) / 2,
        top: 150,
        width: PHONE_W,
        transformOrigin: "0 0",
        scale: "1.12",
      }}
    >
      <Phone dark>
        <Screenshot name="results-cards-dark" />
      </Phone>
    </div>
  </AbsoluteFill>
);
