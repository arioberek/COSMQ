import { memo, type ReactNode } from "react";
import { ActivityIndicator } from "react-native";
import { type GetProps, styled, Button as TamaguiButton, useTheme } from "tamagui";
import { AppText } from "./Text";

// iOS button styles: filled (prominent), tinted, gray, plain, destructive.
const StyledButton = styled(TamaguiButton, {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: "$sm",
  borderWidth: 0,
  animation: "quick",
  pressStyle: { scale: 0.97, opacity: 0.8 },

  variants: {
    tone: {
      filled: { backgroundColor: "$accent", pressStyle: { backgroundColor: "$accentLight" } },
      tinted: { backgroundColor: "$accentMuted", pressStyle: { backgroundColor: "$accentMuted" } },
      gray: { backgroundColor: "$fill", pressStyle: { backgroundColor: "$fill" } },
      plain: { backgroundColor: "transparent", pressStyle: { backgroundColor: "transparent" } },
      destructive: { backgroundColor: "$dangerMuted", pressStyle: { backgroundColor: "$dangerMuted" } },
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

type ButtonProps = Omit<GetProps<typeof StyledButton>, "children" | "size" | "buttonSize" | "tone" | "variant"> & {
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
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      {...props}
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
