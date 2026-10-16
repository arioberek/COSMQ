import { useMemo } from "react";
import { useTheme as useTamaguiTheme } from "tamagui";
import { useResolvedColorScheme } from "./useResolvedColorScheme";

/**
 * Plain-string view of the Tamagui theme for StyleSheet-based code.
 * Tamagui (tamagui.config.ts) is the single source of truth for colors.
 */
export const useTheme = () => {
  const t = useTamaguiTheme();
  const mode = useResolvedColorScheme();

  return useMemo(() => {
    const v = (key: keyof typeof t) => String(t[key]?.val ?? "");
    return {
      mode,
      colors: {
        background: v("background"),
        backgroundAlt: v("backgroundHover"),
        surface: v("surface"),
        surfaceAlt: v("surfaceAlt"),
        surfaceMuted: v("surfaceMuted"),
        surfaceElevated: v("surfaceElevated"),
        text: v("color"),
        textMuted: v("textMuted"),
        textSubtle: v("textSubtle"),
        border: v("borderColor"),
        borderSubtle: v("borderSubtle"),
        primary: v("primary"),
        primaryMuted: v("primaryMuted"),
        primaryLight: v("primaryLight"),
        success: v("success"),
        successMuted: v("successMuted"),
        warning: v("warning"),
        warningMuted: v("warningMuted"),
        danger: v("danger"),
        dangerMuted: v("dangerMuted"),
        accent: v("accent"),
        accentFill: v("accentFill"),
        accentMuted: v("accentMuted"),
        placeholder: v("placeholderColor"),
        disabled: v("disabled"),
        fill: v("fill"),
        overlay: v("overlay"),
        onAccent: v("textOnAccent"),
      },
      syntax: {
        keyword: v("syntaxKeyword"),
        string: v("syntaxString"),
        number: v("syntaxNumber"),
        comment: v("syntaxComment"),
        operator: v("syntaxOperator"),
        punctuation: v("syntaxPunctuation"),
        identifier: v("syntaxIdentifier"),
        default: v("syntaxDefault"),
      },
    };
  }, [t, mode]);
};

export type AppTheme = ReturnType<typeof useTheme>;
