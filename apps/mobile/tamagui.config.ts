import { createAnimations } from "@tamagui/animations-react-native";
import { tokens as defaultTokens } from "@tamagui/config/v3";
import { shorthands } from "@tamagui/shorthands";
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
    Object.entries(TYPE_SCALE).map(([key, size]) => [key, lineHeightFor(size)]),
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
    darkBackground: "#08080f",
    darkBackgroundAlt: "#0c0c14",
    darkSurface: "#16161f",
    darkSurfaceAlt: "#1f1f2c",
    darkSurfaceMuted: "#2a2a3a",
    darkSurfaceElevated: "#22222f",
    darkText: "#f0f0f5",
    darkTextMuted: "#c5c5d6",
    darkTextSubtle: "#9a9ab0",
    darkBorder: "rgba(255, 255, 255, 0.10)",
    darkBorderSubtle: "rgba(255, 255, 255, 0.06)",
    darkPrimary: "#7559ec",
    darkPrimaryMuted: "rgba(117, 89, 236, 0.20)",
    darkPrimaryLight: "#9b88f5",
    darkSecondary: "#7559ec",
    darkSecondaryMuted: "rgba(117, 89, 236, 0.20)",
    darkSuccess: "#3ddc84",
    darkSuccessMuted: "rgba(61, 220, 132, 0.16)",
    darkSuccessLight: "#7fefae",
    darkWarning: "#ffab40",
    darkWarningMuted: "rgba(255, 171, 64, 0.16)",
    darkDanger: "#ff5b5b",
    darkDangerMuted: "rgba(255, 91, 91, 0.16)",
    darkAccent: "#7559ec",
    darkAccentMuted: "rgba(117, 89, 236, 0.20)",
    darkAccentLight: "#9b88f5",
    darkPlaceholder: "#6e6e84",
    darkDisabled: "#3a3a4a",
    darkGlow: "rgba(0, 0, 0, 0.55)",
    darkGlowSubtle: "rgba(0, 0, 0, 0.3)",
    darkCard: "#16161f",
    darkCardBorder: "rgba(255, 255, 255, 0.10)",
    darkOverlay: "rgba(4, 4, 9, 0.86)",

    lightBackground: "#fafbfd",
    lightBackgroundAlt: "#eef0f5",
    lightSurface: "#ffffff",
    lightSurfaceAlt: "#f1f3f9",
    lightSurfaceMuted: "#e6e8f0",
    lightSurfaceElevated: "#ffffff",
    lightText: "#0f0f1a",
    lightTextMuted: "#3a3a4f",
    lightTextSubtle: "#56566d",
    lightBorder: "rgba(15, 15, 26, 0.13)",
    lightBorderSubtle: "rgba(15, 15, 26, 0.09)",
    lightPrimary: "#5e47e6",
    lightPrimaryMuted: "rgba(94, 71, 230, 0.14)",
    lightPrimaryLight: "#8576f0",
    lightSecondary: "#5e47e6",
    lightSecondaryMuted: "rgba(94, 71, 230, 0.14)",
    lightSuccess: "#1f9d55",
    lightSuccessMuted: "rgba(31, 157, 85, 0.14)",
    lightSuccessLight: "#4ade80",
    lightWarning: "#d97706",
    lightWarningMuted: "rgba(217, 119, 6, 0.14)",
    lightDanger: "#dc2626",
    lightDangerMuted: "rgba(220, 38, 38, 0.14)",
    lightAccent: "#5e47e6",
    lightAccentMuted: "rgba(94, 71, 230, 0.14)",
    lightAccentLight: "#8576f0",
    lightPlaceholder: "#8b92a0",
    lightDisabled: "#d1d5db",
    lightGlow: "rgba(15, 15, 26, 0.12)",
    lightGlowSubtle: "rgba(15, 15, 26, 0.07)",
    lightCard: "#ffffff",
    lightCardBorder: "rgba(15, 15, 26, 0.11)",
    lightOverlay: "rgba(15, 15, 26, 0.55)",
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

  dialogOverlay: cosmicTokens.color.darkOverlay,
  dialogBorder: "rgba(255,255,255,0.12)",
  dialogText: "#f0f0f5",
  dialogTextMuted: "#c5c5d6",
  dialogButtonBorder: "rgba(255,255,255,0.14)",
  dialogButtonHover: "rgba(255,255,255,0.08)",
  dialogHandle: "rgba(255,255,255,0.26)",

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

  dialogOverlay: cosmicTokens.color.lightOverlay,
  dialogBorder: "rgba(15, 15, 26, 0.13)",
  dialogText: "#0f0f1a",
  dialogTextMuted: "#3a3a4f",
  dialogButtonBorder: "rgba(15, 15, 26, 0.15)",
  dialogButtonHover: "rgba(15, 15, 26, 0.07)",
  dialogHandle: "rgba(15, 15, 26, 0.24)",

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
