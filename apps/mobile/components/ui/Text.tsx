import { styled, Text } from "tamagui";

/**
 * Apple text styles (Dynamic Type "Large" sizes). No letterSpacing: iOS applies
 * SF Pro's optical tracking automatically, and Android's Roboto needs none.
 * No explicit lineHeight either: native labels use the font's natural line
 * height, and on iOS React Native puts any extra lineHeight above the glyphs,
 * which pushes single-line labels below center in buttons, chips and rows.
 */
export const AppText = styled(Text, {
  name: "AppText",
  fontFamily: "$body",
  color: "$color",

  variants: {
    variant: {
      largeTitle: { fontSize: 34, fontWeight: "700" },
      title1: { fontSize: 28, fontWeight: "700" },
      title2: { fontSize: 22, fontWeight: "700" },
      title3: { fontSize: 20, fontWeight: "600" },
      headline: { fontSize: 17, fontWeight: "600" },
      body: { fontSize: 17, fontWeight: "400" },
      callout: { fontSize: 16, fontWeight: "400" },
      subhead: { fontSize: 15, fontWeight: "400" },
      footnote: { fontSize: 13, fontWeight: "400" },
      caption: { fontSize: 12, fontWeight: "400" },
      caption2: { fontSize: 11, fontWeight: "400" },
      code: { fontFamily: "$mono", fontSize: 13, fontWeight: "400" },
    },
    tone: {
      primary: { color: "$color" },
      secondary: { color: "$textMuted" },
      tertiary: { color: "$textSubtle" },
      accent: { color: "$accent" },
      danger: { color: "$danger" },
      success: { color: "$success" },
      warning: { color: "$warning" },
      onAccent: { color: "$textOnAccent" },
    },
    emphasized: {
      true: { fontWeight: "600" },
    },
  } as const,

  defaultVariants: {
    variant: "body",
    tone: "primary",
  },
});
