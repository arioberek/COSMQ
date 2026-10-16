import { Ionicons } from "@expo/vector-icons";
import { memo, type ReactNode } from "react";
import { Pressable } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";
import { CONNECTION_COLORS, type ConnectionColor } from "../../lib/types";

const COLOR_NAMES: Record<ConnectionColor, string> = {
  "#6366f1": "Indigo",
  "#8b5cf6": "Violet",
  "#ec4899": "Pink",
  "#ef4444": "Red",
  "#f97316": "Orange",
  "#eab308": "Yellow",
  "#22c55e": "Green",
  "#14b8a6": "Teal",
  "#06b6d4": "Cyan",
  "#3b82f6": "Blue",
};

const DOT = 28;
const RING = DOT + 8;
// Six swatches per row: eleven choices wrap into two tidy rows on any phone width.
const COLUMN_WIDTH = `${100 / 6}%` as const;

type SwatchProps = {
  label: string;
  selected: boolean;
  ringColor: string;
  onPress: () => void;
  children: ReactNode;
};

function Swatch({ label, selected, ringColor, onPress, children }: SwatchProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected, checked: selected }}
      style={({ pressed }) => ({
        width: COLUMN_WIDTH,
        alignItems: "center",
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <YStack
        width={RING}
        height={RING}
        borderRadius={RING / 2}
        borderWidth={2}
        borderColor={selected ? ringColor : "transparent"}
        alignItems="center"
        justifyContent="center"
      >
        {children}
      </YStack>
    </Pressable>
  );
}

type ColorTagPickerProps = {
  value: ConnectionColor | undefined;
  onChange: (color: ConnectionColor | undefined) => void;
  /** Injected by ListSection. */
  showSeparator?: boolean;
};

/** Reminders-style row of color dots, with a "None" swatch first. */
export const ColorTagPicker = memo(function ColorTagPicker({
  value,
  onChange,
}: ColorTagPickerProps) {
  const theme = useTheme();

  return (
    <XStack
      flexWrap="wrap"
      rowGap="$sm"
      paddingHorizontal="$xs"
      paddingVertical={12}
      accessibilityRole="radiogroup"
    >
      <Swatch
        label="No color"
        selected={!value}
        ringColor={theme.textSubtle.val}
        onPress={() => onChange(undefined)}
      >
        <YStack
          width={DOT}
          height={DOT}
          borderRadius={DOT / 2}
          backgroundColor="$fill"
          alignItems="center"
          justifyContent="center"
        >
          <Ionicons name="close" size={16} color={theme.textSubtle.val} />
        </YStack>
      </Swatch>
      {CONNECTION_COLORS.map((color) => (
        <Swatch
          key={color}
          label={COLOR_NAMES[color]}
          selected={value === color}
          ringColor={color}
          onPress={() => onChange(color)}
        >
          <YStack width={DOT} height={DOT} borderRadius={DOT / 2} backgroundColor={color} />
        </Swatch>
      ))}
    </XStack>
  );
});
