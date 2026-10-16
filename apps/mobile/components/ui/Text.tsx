import { styled, Text } from "tamagui";

/**
 * Apple text styles (Dynamic Type "Large" sizes). No letterSpacing: iOS applies
 * SF Pro's optical tracking automatically, and Android's Roboto needs none.
 */
export const AppText = styled(Text, {
  name: "AppText",
  fontFamily: "$body",
  color: "$color",

  variants: {
    variant: {
      largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: "700" },
      title1: { fontSize: 28, lineHeight: 34, fontWeight: "700" },
      title2: { fontSize: 22, lineHeight: 28, fontWeight: "700" },
      title3: { fontSize: 20, lineHeight: 25, fontWeight: "600" },
      headline: { fontSize: 17, lineHeight: 22, fontWeight: "600" },
      body: { fontSize: 17, lineHeight: 22, fontWeight: "400" },
      callout: { fontSize: 16, lineHeight: 21, fontWeight: "400" },
      subhead: { fontSize: 15, lineHeight: 20, fontWeight: "400" },
      footnote: { fontSize: 13, lineHeight: 18, fontWeight: "400" },
      caption: { fontSize: 12, lineHeight: 16, fontWeight: "400" },
      caption2: { fontSize: 11, lineHeight: 13, fontWeight: "400" },
      code: { fontFamily: "$mono", fontSize: 13, lineHeight: 18, fontWeight: "400" },
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
