import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadInstrumentSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";
import { Easing } from "remotion";

// Video typography matches the landing page: Geist, Geist Mono and an
// italic Instrument Serif used sparingly for one accent word.
const geist = loadGeist("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });
const geistMono = loadGeistMono("normal", { weights: ["400", "500"], subsets: ["latin"] });
const serif = loadInstrumentSerif("italic", { weights: ["400"], subsets: ["latin"] });
// In-phone UI is rebuilt with the fonts the app screenshots use.
const inter = loadInter("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });
const jetbrains = loadJetBrainsMono("normal", { weights: ["400"], subsets: ["latin"] });

export const fonts = {
  sans: geist.fontFamily,
  mono: geistMono.fontFamily,
  serif: serif.fontFamily,
  ui: inter.fontFamily,
  code: jetbrains.fontFamily,
};

export const colors = {
  violet: "#6e56cf",
  violetDark: "#9585f2",
  violetDeep: "#5b45b8",
  canvas: "#f2f2f7",
  canvasDeep: "#e9e9ee",
  black: "#000000",
  ink: "#0b0b0f",
  white: "#ffffff",
  secondary: "#6e6e73",
  secondaryDark: "#98989f",
  hairline: "rgba(60, 60, 67, 0.18)",
  hairlineDark: "rgba(84, 84, 88, 0.6)",
  // App theme tokens (apps/mobile/tamagui.config.ts)
  surface: "#ffffff",
  fill: "rgba(118, 118, 128, 0.12)",
  pill: "#e5e5ea",
  warning: "#c93400",
  warningMuted: "rgba(255, 149, 0, 0.14)",
  danger: "#d70015",
  dangerMuted: "rgba(255, 59, 48, 0.12)",
  success: "#248a3d",
  iosBlue: "#007aff",
  iosRed: "#ff3b30",
};

// Xcode light syntax colors, as used by the app's editor.
export const syntax = {
  keyword: "#9b2393",
  string: "#c41a16",
  number: "#1c00cf",
  operator: "#326d74",
  punctuation: "#3c3c43",
  identifier: "#000000",
};

export const ease = {
  /** Strong ease-out for entrances and UI responses. */
  out: Easing.bezier(0.23, 1, 0.32, 1),
  /** Strong ease-in-out for things moving on screen (camera, morphs). */
  inOut: Easing.bezier(0.77, 0, 0.175, 1),
  /** iOS sheet / push curve. */
  drawer: Easing.bezier(0.32, 0.72, 0, 1),
  /** Exits: quick and quiet. */
  in: Easing.bezier(0.55, 0, 1, 0.45),
};

export const VIDEO = { width: 1920, height: 1080, fps: 30 } as const;
