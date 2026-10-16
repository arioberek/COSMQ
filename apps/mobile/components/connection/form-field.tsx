import { type ReactNode, type RefObject, useRef } from "react";
import { ActivityIndicator, Pressable, type TextInput } from "react-native";
import { useTheme, XStack } from "tamagui";
import { AppText, Input } from "../ui";
import type { InputProps } from "../ui/Input";

type FormFieldProps = Omit<InputProps, "ref"> & {
  /** Leading label. Omit for a full-width field (put the label in the section title). */
  label?: string;
  inputRef?: RefObject<TextInput | null>;
  /** Trailing element after the field, e.g. a small "Paste" button. */
  trailing?: ReactNode;
  /** Injected by ListSection. */
  showSeparator?: boolean;
};

/**
 * Grouped form row: label on the left, right-aligned borderless field filling the
 * rest. Tapping anywhere on the row focuses the field, like UIKit forms.
 */
export function FormField({
  label,
  inputRef,
  trailing,
  showSeparator,
  align,
  ...inputProps
}: FormFieldProps) {
  const localRef = useRef<TextInput>(null);
  const ref = inputRef ?? localRef;

  return (
    <Pressable onPress={() => ref.current?.focus()} accessible={false}>
      <XStack minHeight={44} paddingLeft="$md" alignItems="center">
        <XStack
          flex={1}
          minHeight={44}
          alignItems="center"
          gap="$md"
          paddingRight="$md"
          borderBottomWidth={showSeparator ? 0.5 : 0}
          borderBottomColor="$borderColor"
        >
          {label ? (
            <AppText variant="body" flexShrink={0}>
              {label}
            </AppText>
          ) : null}
          <Input
            ref={ref}
            align={align ?? (label ? "right" : "left")}
            accessibilityLabel={label}
            {...inputProps}
          />
          {trailing}
        </XStack>
      </XStack>
    </Pressable>
  );
}

type FormControlRowProps = {
  title: string;
  control: ReactNode;
  showSeparator?: boolean;
};

/** Row with a title and a trailing control (usually a Switch). */
export function FormControlRow({ title, control, showSeparator }: FormControlRowProps) {
  return (
    <XStack minHeight={44} paddingLeft="$md" alignItems="center">
      <XStack
        flex={1}
        minHeight={44}
        alignItems="center"
        gap="$md"
        paddingVertical={6}
        paddingRight="$md"
        borderBottomWidth={showSeparator ? 0.5 : 0}
        borderBottomColor="$borderColor"
      >
        <AppText variant="body" flex={1} numberOfLines={1}>
          {title}
        </AppText>
        {control}
      </XStack>
    </XStack>
  );
}

/** Text button for the navigation bar ("Cancel", "Save"). */
export function HeaderTextButton({
  label,
  onPress,
  emphasized,
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  emphasized?: boolean;
  disabled?: boolean;
  loading?: boolean;
}) {
  const theme = useTheme();

  if (loading) {
    return <ActivityIndicator color={theme.textSubtle.val} accessibilityLabel={`${label}…`} />;
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => ({ paddingHorizontal: 4, opacity: pressed ? 0.5 : 1 })}
    >
      <AppText variant="body" emphasized={emphasized} tone={disabled ? "tertiary" : "accent"}>
        {label}
      </AppText>
    </Pressable>
  );
}
