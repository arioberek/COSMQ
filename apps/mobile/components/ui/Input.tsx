import { memo, type Ref } from "react";
import { TextInput, type TextInputProps } from "react-native";
import { useTheme } from "tamagui";

export type InputProps = TextInputProps & {
  /** JetBrains Mono, for hosts, ports, paths and URLs. */
  mono?: boolean;
  align?: "left" | "right";
  ref?: Ref<TextInput>;
};

// Typography mirrors AppText: `body` (17pt system) or a mono face sized to sit on
// the same baseline inside a 44pt row.
const FIELD_TEXT = {
  body: { fontSize: 17 },
  mono: { fontFamily: "JetBrainsMono", fontSize: 15 },
} as const;

/**
 * Borderless iOS text field. Place it inside a grouped row (`$surface`); it takes
 * the remaining width and uses the accent for the caret and selection.
 */
export const Input = memo(function Input({
  mono,
  align = "left",
  style,
  ref,
  ...props
}: InputProps) {
  const theme = useTheme();

  return (
    <TextInput
      ref={ref}
      placeholderTextColor={theme.placeholderColor.val}
      selectionColor={theme.accent.val}
      cursorColor={theme.accent.val}
      style={[
        {
          flex: 1,
          minWidth: 0,
          paddingVertical: 11,
          paddingHorizontal: 0,
          color: theme.color.val,
          textAlign: align,
        },
        mono ? FIELD_TEXT.mono : FIELD_TEXT.body,
        style,
      ]}
      {...props}
    />
  );
});
