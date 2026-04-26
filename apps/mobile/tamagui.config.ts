import { createAnimations } from "@tamagui/animations-react-native";
import { shorthands } from "@tamagui/shorthands";
import { tokens as defaultTokens } from "@tamagui/config/v3";
import { createFont, createTamagui, createTokens } from "tamagui";

const animations = createAnimations({
  bouncy: {
    type: "spring",
    damping: 10,
    mass: 0.9,
    stiffness: 100,
  },
  lazy: {
    type: "spring",
    damping: 20,
    stiffness: 60,
  },
  quick: {
    type: "spring",
    damping: 20,
    stiffness: 250,
  },
  medium: {
    type: "spring",
    damping: 15,
    stiffness: 120,
  },
  slow: {
    type: "spring",
    damping: 20,
    stiffness: 60,
  },
  tooltip: {
    type: "spring",
    damping: 10,
    mass: 0.9,
    stiffness: 100,
  },
});

const TYPE_SCALE = {
  1: 11,
  2: 12,
  3: 13,
  4: 14,
  5: 15,
  6: 16,
  7: 20,
  8: 24,
  9: 28,
  10: 32,
  11: 36,
  12: 40,
  13: 48,
  14: 56,
  15: 64,
  16: 72,
} as const;

const lineHeightFor = (size: number) =>
  size <= 16 ? Math.round(size * 1.4) : Math.round(size * 1.2);

const buildLineHeight = () =>
  Object.fromEntries(
    Object.entries(TYPE_SCALE).map(([key, size]) => [key, lineHeightFor(size)])
  ) as Record<keyof typeof TYPE_SCALE, number>;

const SYSTEM_STACK = "System";

const headingFont = createFont({
  family: SYSTEM_STACK,
  size: { ...TYPE_SCALE, true: 16 },
  lineHeight: { ...buildLineHeight(), true: 22 },
  weight: {
    4: "400",
    5: "500",
    6: "600",
    7: "700",
  },
  letterSpacing: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: -0.1,
    7: -0.2,
    8: -0.3,
    9: -0.4,
    10: -0.5,
  },
  face: {
    400: { normal: SYSTEM_STACK },
    500: { normal: SYSTEM_STACK },
    600: { normal: SYSTEM_STACK },
    700: { normal: SYSTEM_STACK },
  },
});

const bodyFont = createFont({
  family: SYSTEM_STACK,
  size: { ...TYPE_SCALE, true: 14 },
  lineHeight: { ...buildLineHeight(), true: 20 },
  weight: {
    4: "400",
    5: "500",
    6: "600",
    7: "700",
  },
  face: {
    400: { normal: SYSTEM_STACK },
    500: { normal: SYSTEM_STACK },
    600: { normal: SYSTEM_STACK },
    700: { normal: SYSTEM_STACK },
  },
});

const monoFont = createFont({
  family: "JetBrainsMono",
  size: {
    1: 11,
    2: 12,
    3: 13,
    4: 14,
    5: 15,
    6: 16,
    7: 18,
    8: 20,
    true: 14,
  },
  lineHeight: {
    1: 16,
    2: 18,
    3: 18,
    4: 20,
    5: 21,
    6: 22,
    7: 24,
    8: 26,
    true: 20,
  },
  weight: {
    4: "400",
    7: "700",
  },
  face: {
    400: { normal: "JetBrainsMono" },
    700: { normal: "JetBrainsMono" },
  },
});

const cosmicTokens = createTokens({
  ...defaultTokens,
  size: {
    ...defaultTokens.size,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    // Component-specific sizes
    buttonSm: 36,
    buttonMd: 44,
    buttonLg: 52,
    inputSm: 40,
    inputMd: 48,
    inputLg: 56,
  },
  color: {
    ...defaultTokens.color,
    darkBackground: "#0c0c12",
    darkBackgroundAlt: "#101018",
    darkSurface: "#15151d",
    darkSurfaceAlt: "#1c1c26",
    darkSurfaceMuted: "#232330",
    darkSurfaceElevated: "#1e1e2a",
    darkText: "#f0f0f5",
    darkTextMuted: "#bcbcce",
    darkTextSubtle: "#8a8aa0",
    darkBorder: "rgba(255, 255, 255, 0.08)",
    darkBorderSubtle: "rgba(255, 255, 255, 0.04)",
    darkPrimary: "#7c5cff",
    darkPrimaryMuted: "rgba(124, 92, 255, 0.15)",
    darkPrimaryLight: "#9d85ff",
    darkSecondary: "#7c5cff",
    darkSecondaryMuted: "rgba(124, 92, 255, 0.15)",
    darkSuccess: "#3ddc84",
    darkSuccessMuted: "rgba(61, 220, 132, 0.12)",
    darkSuccessLight: "#7fefae",
    darkWarning: "#ffab40",
    darkWarningMuted: "rgba(255, 171, 64, 0.12)",
    darkDanger: "#ff5b5b",
    darkDangerMuted: "rgba(255, 91, 91, 0.12)",
    darkAccent: "#7c5cff",
    darkAccentMuted: "rgba(124, 92, 255, 0.15)",
    darkAccentLight: "#9d85ff",
    darkPlaceholder: "#5b5b6e",
    darkDisabled: "#3a3a4a",
    darkGlow: "rgba(0, 0, 0, 0.5)",
    darkGlowSubtle: "rgba(0, 0, 0, 0.25)",
    darkCard: "#15151d",
    darkCardBorder: "rgba(255, 255, 255, 0.08)",
    darkOverlay: "rgba(8, 8, 14, 0.78)",

    lightBackground: "#fafbfc",
    lightBackgroundAlt: "#f1f2f5",
    lightSurface: "#ffffff",
    lightSurfaceAlt: "#f5f6fa",
    lightSurfaceMuted: "#ebedf2",
    lightSurfaceElevated: "#ffffff",
    lightText: "#0f0f1a",
    lightTextMuted: "#3a3a4f",
    lightTextSubtle: "#5e5e74",
    lightBorder: "rgba(15, 15, 26, 0.10)",
    lightBorderSubtle: "rgba(15, 15, 26, 0.06)",
    lightPrimary: "#6b4eff",
    lightPrimaryMuted: "rgba(107, 78, 255, 0.10)",
    lightPrimaryLight: "#8b72ff",
    lightSecondary: "#6b4eff",
    lightSecondaryMuted: "rgba(107, 78, 255, 0.10)",
    lightSuccess: "#1f9d55",
    lightSuccessMuted: "rgba(31, 157, 85, 0.10)",
    lightSuccessLight: "#4ade80",
    lightWarning: "#d97706",
    lightWarningMuted: "rgba(217, 119, 6, 0.10)",
    lightDanger: "#dc2626",
    lightDangerMuted: "rgba(220, 38, 38, 0.10)",
    lightAccent: "#6b4eff",
    lightAccentMuted: "rgba(107, 78, 255, 0.10)",
    lightAccentLight: "#8b72ff",
    lightPlaceholder: "#9ca3af",
    lightDisabled: "#d1d5db",
    lightGlow: "rgba(15, 15, 26, 0.10)",
    lightGlowSubtle: "rgba(15, 15, 26, 0.05)",
    lightCard: "#ffffff",
    lightCardBorder: "rgba(15, 15, 26, 0.08)",
    lightOverlay: "rgba(15, 15, 26, 0.45)",
  },
  space: {
    ...defaultTokens.space,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radius: {
    ...defaultTokens.radius,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
});

const darkTheme = {
  background: cosmicTokens.color.darkBackground,
  backgroundHover: cosmicTokens.color.darkBackgroundAlt,
  backgroundPress: cosmicTokens.color.darkSurface,
  backgroundFocus: cosmicTokens.color.darkSurface,
  backgroundStrong: cosmicTokens.color.darkSurface,
  backgroundTransparent: "transparent",

  color: cosmicTokens.color.darkText,
  colorHover: cosmicTokens.color.darkText,
  colorPress: cosmicTokens.color.darkTextMuted,
  colorFocus: cosmicTokens.color.darkText,
  colorTransparent: "transparent",

  borderColor: cosmicTokens.color.darkBorder,
  borderColorHover: cosmicTokens.color.darkBorderSubtle,
  borderColorFocus: cosmicTokens.color.darkPrimary,
  borderColorPress: cosmicTokens.color.darkPrimary,

  placeholderColor: cosmicTokens.color.darkPlaceholder,

  primary: cosmicTokens.color.darkPrimary,
  primaryMuted: cosmicTokens.color.darkPrimaryMuted,
  primaryLight: cosmicTokens.color.darkPrimaryLight,
  secondary: cosmicTokens.color.darkSecondary,
  secondaryMuted: cosmicTokens.color.darkSecondaryMuted,
  success: cosmicTokens.color.darkSuccess,
  successMuted: cosmicTokens.color.darkSuccessMuted,
  successLight: cosmicTokens.color.darkSuccessLight,
  warning: cosmicTokens.color.darkWarning,
  warningMuted: cosmicTokens.color.darkWarningMuted,
  danger: cosmicTokens.color.darkDanger,
  dangerMuted: cosmicTokens.color.darkDangerMuted,
  accent: cosmicTokens.color.darkAccent,
  accentMuted: cosmicTokens.color.darkAccentMuted,
  accentLight: cosmicTokens.color.darkAccentLight,

  surface: cosmicTokens.color.darkSurface,
  surfaceAlt: cosmicTokens.color.darkSurfaceAlt,
  surfaceMuted: cosmicTokens.color.darkSurfaceMuted,
  surfaceElevated: cosmicTokens.color.darkSurfaceElevated,

  textMuted: cosmicTokens.color.darkTextMuted,
  textSubtle: cosmicTokens.color.darkTextSubtle,

  disabled: cosmicTokens.color.darkDisabled,
  glow: cosmicTokens.color.darkGlow,
  glowSubtle: cosmicTokens.color.darkGlowSubtle,
  card: cosmicTokens.color.darkCard,
  cardBorder: cosmicTokens.color.darkCardBorder,
  overlay: cosmicTokens.color.darkOverlay,

  dialogOverlay: "rgba(8, 8, 14, 0.78)",
  dialogBorder: "rgba(255,255,255,0.10)",
  dialogText: "#f0f0f5",
  dialogTextMuted: "#bcbcce",
  dialogButtonBorder: "rgba(255,255,255,0.12)",
  dialogButtonHover: "rgba(255,255,255,0.06)",
  dialogHandle: "rgba(255,255,255,0.22)",

  shadowColor: "#000000",
  shadowColorStrong: "rgba(0, 0, 0, 0.4)",

  switchThumb: "#ffffff",
  textOnPrimary: "#ffffff",
  textOnDanger: "#ffffff",
  textOnAccent: "#ffffff",
};

const lightTheme = {
  background: cosmicTokens.color.lightBackground,
  backgroundHover: cosmicTokens.color.lightBackgroundAlt,
  backgroundPress: cosmicTokens.color.lightSurface,
  backgroundFocus: cosmicTokens.color.lightSurface,
  backgroundStrong: cosmicTokens.color.lightSurface,
  backgroundTransparent: "transparent",

  color: cosmicTokens.color.lightText,
  colorHover: cosmicTokens.color.lightText,
  colorPress: cosmicTokens.color.lightTextMuted,
  colorFocus: cosmicTokens.color.lightText,
  colorTransparent: "transparent",

  borderColor: cosmicTokens.color.lightBorder,
  borderColorHover: cosmicTokens.color.lightBorderSubtle,
  borderColorFocus: cosmicTokens.color.lightPrimary,
  borderColorPress: cosmicTokens.color.lightPrimary,

  placeholderColor: cosmicTokens.color.lightPlaceholder,

  primary: cosmicTokens.color.lightPrimary,
  primaryMuted: cosmicTokens.color.lightPrimaryMuted,
  primaryLight: cosmicTokens.color.lightPrimaryLight,
  secondary: cosmicTokens.color.lightSecondary,
  secondaryMuted: cosmicTokens.color.lightSecondaryMuted,
  success: cosmicTokens.color.lightSuccess,
  successMuted: cosmicTokens.color.lightSuccessMuted,
  successLight: cosmicTokens.color.lightSuccessLight,
  warning: cosmicTokens.color.lightWarning,
  warningMuted: cosmicTokens.color.lightWarningMuted,
  danger: cosmicTokens.color.lightDanger,
  dangerMuted: cosmicTokens.color.lightDangerMuted,
  accent: cosmicTokens.color.lightAccent,
  accentMuted: cosmicTokens.color.lightAccentMuted,
  accentLight: cosmicTokens.color.lightAccentLight,

  surface: cosmicTokens.color.lightSurface,
  surfaceAlt: cosmicTokens.color.lightSurfaceAlt,
  surfaceMuted: cosmicTokens.color.lightSurfaceMuted,
  surfaceElevated: cosmicTokens.color.lightSurfaceElevated,

  textMuted: cosmicTokens.color.lightTextMuted,
  textSubtle: cosmicTokens.color.lightTextSubtle,

  disabled: cosmicTokens.color.lightDisabled,
  glow: cosmicTokens.color.lightGlow,
  glowSubtle: cosmicTokens.color.lightGlowSubtle,
  card: cosmicTokens.color.lightCard,
  cardBorder: cosmicTokens.color.lightCardBorder,
  overlay: cosmicTokens.color.lightOverlay,

  dialogOverlay: "rgba(15, 15, 26, 0.45)",
  dialogBorder: "rgba(15, 15, 26, 0.10)",
  dialogText: "#0f0f1a",
  dialogTextMuted: "#3a3a4f",
  dialogButtonBorder: "rgba(15, 15, 26, 0.12)",
  dialogButtonHover: "rgba(15, 15, 26, 0.05)",
  dialogHandle: "rgba(15, 15, 26, 0.20)",

  shadowColor: "#0f0f1a",
  shadowColorStrong: "rgba(15, 15, 26, 0.12)",

  switchThumb: "#ffffff",
  textOnPrimary: "#ffffff",
  textOnDanger: "#ffffff",
  textOnAccent: "#ffffff",
};

export const config = createTamagui({
  defaultFont: "body",
  animations,
  shouldAddPrefersColorThemes: true,
  themeClassNameOnRoot: true,
  shorthands,
  fonts: {
    heading: headingFont,
    body: bodyFont,
    mono: monoFont,
  },
  themes: {
    dark: darkTheme,
    light: lightTheme,
    dark_Button: {
      ...darkTheme,
      background: darkTheme.primary,
      backgroundHover: darkTheme.primaryLight,
      backgroundPress: darkTheme.primaryMuted,
      color: "#ffffff",
    },
    light_Button: {
      ...lightTheme,
      background: lightTheme.primary,
      backgroundHover: lightTheme.primaryLight,
      backgroundPress: lightTheme.primaryMuted,
      color: "#ffffff",
    },
    dark_danger: {
      ...darkTheme,
      background: darkTheme.danger,
      backgroundHover: darkTheme.dangerMuted,
      backgroundPress: darkTheme.dangerMuted,
      color: "#ffffff",
    },
    light_danger: {
      ...lightTheme,
      background: lightTheme.danger,
      backgroundHover: lightTheme.dangerMuted,
      backgroundPress: lightTheme.dangerMuted,
      color: "#ffffff",
    },
    dark_success: {
      ...darkTheme,
      background: darkTheme.success,
      backgroundHover: darkTheme.successMuted,
      backgroundPress: darkTheme.successMuted,
      color: "#ffffff",
    },
    light_success: {
      ...lightTheme,
      background: lightTheme.success,
      backgroundHover: lightTheme.successMuted,
      backgroundPress: lightTheme.successMuted,
      color: "#ffffff",
    },
  },
  tokens: cosmicTokens,
  media: {
    xs: { maxWidth: 480 },
    sm: { maxWidth: 660 },
    md: { maxWidth: 900 },
    gtXs: { minWidth: 481 },
    gtSm: { minWidth: 661 },
    gtMd: { minWidth: 901 },
    short: { maxHeight: 700 },
    tall: { minHeight: 701 },
  },
});

export type AppConfig = typeof config;

declare module "tamagui" {
  interface TamaguiCustomConfig extends AppConfig {}
}
