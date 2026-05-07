import { memo } from "react";
import { type GetProps, styled, Input as TamaguiInput, Text, YStack } from "tamagui";

const StyledInput = styled(TamaguiInput, {
  backgroundColor: "$surface",
  borderWidth: 1,
  borderColor: "$borderColor",
  borderRadius: "$md",
  paddingHorizontal: "$md",
  paddingVertical: "$sm",
  color: "$color",
  height: "$inputMd",
  placeholderTextColor: "$placeholderColor",

  focusStyle: {
    borderColor: "$primary",
    borderWidth: 2,
  },

  variants: {
    hasError: {
      true: {
        borderColor: "$danger",
        focusStyle: {
          borderColor: "$danger",
          borderWidth: 2,
        },
      },
    },
    inputSize: {
      sm: {
        height: "$inputSm",
        paddingHorizontal: "$sm",
      },
      md: {
        height: "$inputMd",
        paddingHorizontal: "$md",
      },
      lg: {
        height: "$inputLg",
        paddingHorizontal: "$lg",
      },
    },
  } as const,

  defaultVariants: {
    inputSize: "md",
  },
});

type StyledInputProps = GetProps<typeof StyledInput>;

type InputSize = "sm" | "md" | "lg";

type InputProps = Omit<StyledInputProps, "size" | "inputSize"> & {
  size?: InputSize;
  label?: string;
  error?: string;
};

export const Input = memo(function Input({
  label,
  error,
  hasError,
  size = "md",
  ...props
}: InputProps) {
  const showError = Boolean(error) || hasError;

  return (
    <YStack gap="$xs">
      {label ? (
        <Text color="$textMuted" fontSize={14} fontWeight="500">
          {label}
        </Text>
      ) : null}
      <StyledInput inputSize={size} hasError={showError} {...props} />
      {error ? (
        <Text color="$danger" fontSize={12}>
          {error}
        </Text>
      ) : null}
    </YStack>
  );
});
