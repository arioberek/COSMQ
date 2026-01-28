import { memo } from "react";
import {
  Input as TamaguiInput,
  styled,
  Text,
  YStack,
  type GetProps,
} from "tamagui";

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
    size: {
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
    size: "md",
  },
});

type StyledInputProps = GetProps<typeof StyledInput>;

type InputProps = StyledInputProps & {
  label?: string;
  error?: string;
};

export const Input = memo(function Input({ label, error, hasError, ...props }: InputProps) {
  const showError = Boolean(error) || hasError;

  return (
    <YStack gap="$xs">
      {label ? (
        <Text color="$textMuted" fontSize={14} fontWeight="500">
          {label}
        </Text>
      ) : null}
      <StyledInput hasError={showError} {...props} />
      {error ? (
        <Text color="$danger" fontSize={12}>
          {error}
        </Text>
      ) : null}
    </YStack>
  );
});
