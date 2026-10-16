import { createAnimations } from "@tamagui/animations-react-native";
import { tokens as defaultTokens } from "@tamagui/config/v3";
import { shorthands } from "@tamagui/shorthands";
import { createFont, createTamagui, createTokens } from "tamagui";

// All UI motion uses critically-damped springs so animations settle without
// overshoot. The previous values were under-damped (damping 10-20 vs the ~30
// needed for no oscillation) which made dialogs, sheets, switches, and any
// `pressStyle` visibly wiggle on settle. `bouncy` and `tooltip` keep their
// names but no longer bounce — call sites stay legal without code edits.
const animations = createAnimations({
  bouncy: {
    type: "spring",
    damping: 30,
    mass: 1,
    stiffness: 280,
  },
  lazy: {
    type: "spring",
    damping: 28,
    mass: 1,
    stiffness: 130,
  },
  quick: {
    type: "spring",
    damping: 30,
    mass: 1,
    stiffness: 280,
  },
  medium: {
    type: "spring",
    damping: 30,
    mass: 1,
    stiffness: 200,
  },
  slow: {
    type: "spring",
    damping: 28,
    mass: 1,
    stiffness: 130,
  },
  tooltip: {
    type: "spring",
    damping: 30,
    mass: 1,
    stiffness: 280,
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

// iOS-native palette (UIKit system colors) with one brand accent: a toned-down
// violet. Values mirror Apple's semantic colors so screens read as native in both
// appearances; status colors use Apple's accessible variants for text contrast.
const palette = {
  light: {
    groupedBackground: "#f2f2f7",
    groupedBackgroundAlt: "#e9e9ee",
    surface: "#ffffff",
    surfaceAlt: "#f2f2f7",
    surfaceMuted: "#e5e5ea",
    surfaceElevated: "#ffffff",
    label: "#000000",
    secondaryLabel: "rgba(60, 60, 67, 0.6)",
    tertiaryLabel: "#8a8a8e",
    placeholder: "rgba(60, 60, 67, 0.3)",
    separator: "rgba(60, 60, 67, 0.29)",
    separatorSubtle: "rgba(60, 60, 67, 0.12)",
    fill: "rgba(118, 118, 128, 0.12)",
    accent: "#6e56cf",
    accentPressed: "#5b45b8",
    accentMuted: "rgba(110, 86, 207, 0.12)",
    success: "#248a3d",
    successMuted: "rgba(52, 199, 89, 0.14)",
    successLight: "#34c759",
    warning: "#c93400",
    warningMuted: "rgba(255, 149, 0, 0.14)",
    danger: "#d70015",
    dangerMuted: "rgba(255, 59, 48, 0.12)",
    disabled: "rgba(60, 60, 67, 0.18)",
    overlay: "rgba(0, 0, 0, 0.4)",
    shadow: "rgba(0, 0, 0, 0.08)",
    shadowStrong: "rgba(0, 0, 0, 0.16)",
    // iOS system colors for Settings-style icon tiles.
    tileBlue: "#007aff",
    tileIndigo: "#5856d6",
    tileGray: "#8e8e93",
    tileGreen: "#34c759",
    tileOrange: "#ff9500",
    tileRed: "#ff3b30",
    tilePink: "#ff2d55",
    tileTeal: "#30b0c7",
    // Xcode "Default (Light)" source editor colors.
    syntaxKeyword: "#9b2393",
    syntaxString: "#c41a16",
    syntaxNumber: "#1c00cf",
    syntaxComment: "#5d6c79",
    syntaxOperator: "#326d74",
    syntaxPunctuation: "#3c3c43",
    syntaxIdentifier: "#000000",
    syntaxDefault: "#3c3c43",
  },
  dark: {
    groupedBackground: "#000000",
    groupedBackgroundAlt: "#0c0c0e",
    surface: "#1c1c1e",
    surfaceAlt: "#2c2c2e",
    surfaceMuted: "#3a3a3c",
    surfaceElevated: "#2c2c2e",
    label: "#ffffff",
    secondaryLabel: "rgba(235, 235, 245, 0.6)",
    tertiaryLabel: "#8d8d93",
    placeholder: "rgba(235, 235, 245, 0.3)",
    separator: "rgba(84, 84, 88, 0.65)",
    separatorSubtle: "rgba(84, 84, 88, 0.34)",
    fill: "rgba(118, 118, 128, 0.24)",
    accent: "#9585f2",
    accentPressed: "#a99cf5",
    accentMuted: "rgba(149, 133, 242, 0.2)",
    success: "#30d158",
    successMuted: "rgba(48, 209, 88, 0.18)",
    successLight: "#30d158",
    warning: "#ff9f0a",
    warningMuted: "rgba(255, 159, 10, 0.18)",
    danger: "#ff453a",
    dangerMuted: "rgba(255, 69, 58, 0.18)",
    disabled: "rgba(235, 235, 245, 0.18)",
    overlay: "rgba(0, 0, 0, 0.6)",
    shadow: "rgba(0, 0, 0, 0.3)",
    shadowStrong: "rgba(0, 0, 0, 0.5)",
    tileBlue: "#0a84ff",
    tileIndigo: "#5e5ce6",
    tileGray: "#8e8e93",
    tileGreen: "#30d158",
    tileOrange: "#ff9f0a",
    tileRed: "#ff453a",
    tilePink: "#ff375f",
    tileTeal: "#40c8e0",
    // Xcode "Default (Dark)" source editor colors.
    syntaxKeyword: "#ff7ab2",
    syntaxString: "#ff8170",
    syntaxNumber: "#d9c97c",
    syntaxComment: "#7f8c98",
    syntaxOperator: "#78c2b3",
    syntaxPunctuation: "rgba(235, 235, 245, 0.6)",
    syntaxIdentifier: "#ffffff",
    syntaxDefault: "rgba(235, 235, 245, 0.8)",
  },
} as const;

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
    // Component-specific sizes (iOS: 34pt small, 44pt regular, 50pt large controls)
    buttonSm: 34,
    buttonMd: 44,
    buttonLg: 50,
    inputSm: 36,
    inputMd: 44,
    inputLg: 50,
  },
  color: defaultTokens.color,
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

type Palette = (typeof palette)[keyof typeof palette];

const buildTheme = (p: Palette) => ({
  background: p.groupedBackground,
  backgroundHover: p.groupedBackgroundAlt,
  backgroundPress: p.surfaceMuted,
  backgroundFocus: p.surface,
  backgroundStrong: p.surface,
  backgroundTransparent: "transparent",

  color: p.label,
  colorHover: p.label,
  colorPress: p.secondaryLabel,
  colorFocus: p.label,
  colorTransparent: "transparent",

  borderColor: p.separator,
  borderColorHover: p.separatorSubtle,
  borderColorFocus: p.accent,
  borderColorPress: p.accent,
  borderSubtle: p.separatorSubtle,

  placeholderColor: p.placeholder,

  primary: p.accent,
  primaryMuted: p.accentMuted,
  primaryLight: p.accentPressed,
  secondary: p.accent,
  secondaryMuted: p.accentMuted,
  success: p.success,
  successMuted: p.successMuted,
  successLight: p.successLight,
  warning: p.warning,
  warningMuted: p.warningMuted,
  danger: p.danger,
  dangerMuted: p.dangerMuted,
  accent: p.accent,
  accentMuted: p.accentMuted,
  accentLight: p.accentPressed,

  surface: p.surface,
  surfaceAlt: p.surfaceAlt,
  surfaceMuted: p.surfaceMuted,
  surfaceElevated: p.surfaceElevated,
  fill: p.fill,

  textMuted: p.secondaryLabel,
  textSubtle: p.tertiaryLabel,

  disabled: p.disabled,
  glow: p.shadow,
  glowSubtle: p.shadow,
  card: p.surface,
  cardBorder: p.separatorSubtle,
  overlay: p.overlay,

  dialogOverlay: p.overlay,
  dialogBorder: p.separatorSubtle,
  dialogText: p.label,
  dialogTextMuted: p.secondaryLabel,
  dialogButtonBorder: p.separator,
  dialogButtonHover: p.fill,
  dialogHandle: p.disabled,

  shadowColor: p.shadow,
  shadowColorStrong: p.shadowStrong,

  syntaxKeyword: p.syntaxKeyword,
  syntaxString: p.syntaxString,
  syntaxNumber: p.syntaxNumber,
  syntaxComment: p.syntaxComment,
  syntaxOperator: p.syntaxOperator,
  syntaxPunctuation: p.syntaxPunctuation,
  syntaxIdentifier: p.syntaxIdentifier,
  syntaxDefault: p.syntaxDefault,

  tileBlue: p.tileBlue,
  tileIndigo: p.tileIndigo,
  tileGray: p.tileGray,
  tileGreen: p.tileGreen,
  tileOrange: p.tileOrange,
  tileRed: p.tileRed,
  tilePink: p.tilePink,
  tileTeal: p.tileTeal,

  switchThumb: "#ffffff",
  textOnPrimary: "#ffffff",
  textOnDanger: "#ffffff",
  textOnAccent: "#ffffff",
});

const lightTheme = buildTheme(palette.light);
const darkTheme = buildTheme(palette.dark);

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
