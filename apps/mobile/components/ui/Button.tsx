import { ActivityIndicator } from "react-native";
import {
  Button as TamaguiButton,
  styled,
  Text,
  useTheme,
  type GetProps,
} from "tamagui";

const StyledButton = styled(TamaguiButton, {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: "$sm",
  borderRadius: "$md",
  animation: "quick",

  variants: {
    variant: {
      primary: {
        backgroundColor: "$primary",
        color: "#ffffff",
        pressStyle: {
          backgroundColor: "$primaryLight",
          opacity: 0.9,
        },
      },
      secondary: {
        backgroundColor: "$surface",
        borderWidth: 1,
        borderColor: "$borderColor",
        color: "$color",
        pressStyle: {
          backgroundColor: "$surfaceAlt",
        },
      },
      danger: {
        backgroundColor: "$danger",
        color: "#ffffff",
        pressStyle: {
          backgroundColor: "$dangerMuted",
          opacity: 0.9,
        },
      },
      ghost: {
        backgroundColor: "transparent",
        color: "$color",
        pressStyle: {
          backgroundColor: "$surfaceMuted",
        },
      },
      outlined: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: "$borderColor",
        color: "$color",
        pressStyle: {
          backgroundColor: "$surfaceMuted",
        },
      },
    },
    size: {
      sm: {
        paddingHorizontal: "$md",
        paddingVertical: "$xs",
        height: 36,
      },
      md: {
        paddingHorizontal: "$lg",
        paddingVertical: "$sm",
        height: 44,
      },
      lg: {
        paddingHorizontal: "$xl",
        paddingVertical: "$md",
        height: 52,
      },
    },
  } as const,

  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

type StyledButtonProps = GetProps<typeof StyledButton>;

type ButtonProps = Omit<StyledButtonProps, "children"> & {
  loading?: boolean;
  children: React.ReactNode;
};

export const Button = ({ loading, disabled, children, variant = "primary", ...props }: ButtonProps) => {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const textColor =
    variant === "primary" || variant === "danger" ? "#ffffff" : theme.color.val;

  return (
    <StyledButton
      variant={variant}
      disabled={isDisabled}
      opacity={isDisabled ? 0.6 : 1}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : typeof children === "string" ? (
        <Text color={textColor} fontWeight="600" fontSize={14}>
          {children}
        </Text>
      ) : (
        children
      )}
    </StyledButton>
  );
};
