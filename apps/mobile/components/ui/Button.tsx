import { memo, type ReactNode } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import { type GetProps, styled, Button as TamaguiButton, useTheme } from "tamagui";
import { AppText } from "./Text";

// iOS button styles: filled (prominent), tinted, gray, plain, destructive.
const StyledButton = styled(TamaguiButton, {
  // Own name so Tamagui's `*_Button` sub-themes (white `$color`) don't leak
  // into non-string children rendered with the default AppText tone. Each tone
  // pins its hover background, which used to come from that sub-theme (web).
  name: "AppButton",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: "$sm",
  borderWidth: 0,
  animation: "quick",
  // Press feedback is the scale alone; dimming as well reads as "disabled".
  pressStyle: { scale: 0.97 },

  variants: {
    tone: {
      filled: {
        backgroundColor: "$accentFill",
        pressStyle: { backgroundColor: "$accentFill" },
        hoverStyle: { backgroundColor: "$accentFill" },
      },
      tinted: {
        backgroundColor: "$accentMuted",
        pressStyle: { backgroundColor: "$accentMuted" },
        hoverStyle: { backgroundColor: "$accentMuted" },
      },
      gray: {
        backgroundColor: "$fill",
        pressStyle: { backgroundColor: "$fill" },
        hoverStyle: { backgroundColor: "$fill" },
      },
      plain: {
        backgroundColor: "transparent",
        pressStyle: { backgroundColor: "transparent" },
        hoverStyle: { backgroundColor: "transparent" },
      },
      destructive: {
        backgroundColor: "$dangerMuted",
        pressStyle: { backgroundColor: "$dangerMuted" },
        hoverStyle: { backgroundColor: "$dangerMuted" },
      },
    },
    buttonSize: {
      sm: { height: "$buttonSm", paddingHorizontal: 14, borderRadius: "$full" },
      md: { height: "$buttonMd", paddingHorizontal: "$md", borderRadius: "$md" },
      lg: { height: "$buttonLg", paddingHorizontal: "$lg", borderRadius: "$md" },
    },
  } as const,

  defaultVariants: {
    tone: "filled",
    buttonSize: "md",
  },
});

const ANIMATE_ONLY = ["transform", "opacity"];

type Tone = "filled" | "tinted" | "gray" | "plain" | "destructive";
// Legacy names kept so existing call sites read naturally.
type Variant = Tone | "primary" | "secondary" | "outlined" | "ghost" | "danger";

const TONE_FOR: Record<Variant, Tone> = {
  filled: "filled",
  tinted: "tinted",
  gray: "gray",
  plain: "plain",
  destructive: "destructive",
  primary: "filled",
  secondary: "gray",
  outlined: "gray",
  ghost: "plain",
  danger: "destructive",
};

type ButtonProps = Omit<
  GetProps<typeof StyledButton>,
  "children" | "size" | "buttonSize" | "tone" | "variant"
> & {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: ReactNode;
};

export const Button = memo(function Button({
  loading,
  disabled,
  children,
  variant = "filled",
  size = "md",
  ...props
}: ButtonProps) {
  const theme = useTheme();
  const tone = TONE_FOR[variant];
  const isDisabled = disabled || loading;

  const textColor =
    tone === "filled"
      ? theme.textOnAccent.val
      : tone === "destructive"
        ? theme.danger.val
        : tone === "gray"
          ? theme.color.val
          : theme.accent.val;

  return (
    <StyledButton
      tone={tone}
      buttonSize={size}
      disabled={isDisabled}
      opacity={isDisabled ? 0.45 : 1}
      // Only transform/opacity animate. Tamagui's RN animation driver can't
      // interpolate web CSS-variable colors ("var(--accent)") and throws.
      animateOnly={ANIMATE_ONLY}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      // The 34pt capsule is below the 44pt minimum touch target; pad the hit area.
      hitSlop={size === "sm" ? { top: 5, bottom: 5 } : undefined}
      {...props}
      // Flattened: on web Tamagui hands a style array straight to the DOM, which throws.
      style={
        StyleSheet.flatten([{ borderCurve: "continuous" }, props.style]) as ButtonProps["style"]
      }
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : typeof children === "string" ? (
        <AppText
          variant={size === "sm" ? "subhead" : "headline"}
          emphasized
          style={{ color: textColor }}
          numberOfLines={1}
        >
          {children}
        </AppText>
      ) : (
        children
      )}
    </StyledButton>
  );
});
