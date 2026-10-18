import { Ionicons } from "@expo/vector-icons";
import { memo, useEffect, useState } from "react";
import { Pressable } from "react-native";
import { useTheme as useTamaguiTheme, XStack } from "tamagui";
import { useHaptic } from "../../lib/haptics";
import type { ColumnInfo } from "../../lib/types";
import { AppText } from "../ui/Text";
import { cellKind, formatDate, formatNumberCell, previewString, truthyBoolean } from "./format";

type CellValueProps = {
  column: ColumnInfo;
  value: unknown;
  numberOfLines?: number;
  onJsonPress?: (value: unknown, column: ColumnInfo) => void;
  /** Text alignment for multi-line values. */
  textAlign?: "left" | "right";
  /** Show numbers exactly as the server sent them (detail sheet). */
  exact?: boolean;
};

/** Tertiary italic "NULL", shared by cards, table and detail views. */
export const NullValue = memo(function NullValue() {
  return (
    <AppText variant="code" tone="tertiary" fontStyle="italic">
      NULL
    </AppText>
  );
});

export const CellValue = memo(function CellValue({
  column,
  value,
  numberOfLines = 1,
  onJsonPress,
  textAlign,
  exact = false,
}: CellValueProps) {
  const tamagui = useTamaguiTheme();
  const haptic = useHaptic();
  const [showExact, setShowExact] = useState(false);
  const kind = cellKind(column, value);

  // Auto-revert the long-press "exact value" reveal after a short window. An
  // effect-driven timer cancels itself if the cell is virtualized away or the
  // user long-presses again before it fires, avoiding stale-state writes.
  useEffect(() => {
    if (!showExact) return;
    const id = setTimeout(() => setShowExact(false), 2500);
    return () => clearTimeout(id);
  }, [showExact]);

  if (kind === "null") return <NullValue />;

  if (kind === "boolean") {
    const truthy = truthyBoolean(value);
    return (
      <XStack alignItems="center" gap={4}>
        <Ionicons
          name={truthy ? "checkmark-circle" : "close-circle"}
          size={16}
          color={truthy ? tamagui.success.val : tamagui.textSubtle.val}
        />
        <AppText variant="code" tone="secondary">
          {truthy ? "true" : "false"}
        </AppText>
      </XStack>
    );
  }

  if (kind === "number") {
    const display = formatNumberCell(column, value, exact || showExact);
    if (display === null) {
      return (
        <AppText
          variant="code"
          numberOfLines={numberOfLines}
          style={textAlign ? { textAlign } : undefined}
          selectable
        >
          {String(value)}
        </AppText>
      );
    }
    const isCompact = display !== formatNumberCell(column, value, true);
    return (
      <Pressable
        onLongPress={() => {
          if (isCompact) {
            haptic.light();
            setShowExact(true);
          }
        }}
        delayLongPress={300}
      >
        <AppText
          variant="code"
          fontVariant={["tabular-nums"]}
          numberOfLines={numberOfLines}
          style={textAlign ? { textAlign } : undefined}
          selectable
        >
          {display}
        </AppText>
      </Pressable>
    );
  }

  if (kind === "date") {
    return (
      <AppText
        variant="code"
        numberOfLines={numberOfLines}
        style={textAlign ? { textAlign } : undefined}
        selectable
      >
        {formatDate(value)}
      </AppText>
    );
  }

  if (kind === "json") {
    return (
      <Pressable
        onPress={() => onJsonPress?.(value, column)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Open ${column.name} JSON`}
      >
        <XStack
          alignItems="center"
          gap={4}
          paddingHorizontal={6}
          paddingVertical={2}
          backgroundColor="$fill"
          borderRadius="$sm"
          alignSelf="flex-start"
          style={{ borderCurve: "continuous" }}
        >
          <AppText variant="code" tone="secondary">
            {"{…}"}
          </AppText>
          <AppText variant="caption2" tone="secondary" emphasized>
            JSON
          </AppText>
        </XStack>
      </Pressable>
    );
  }

  return (
    <AppText
      variant="code"
      numberOfLines={numberOfLines}
      style={textAlign ? { textAlign } : undefined}
      selectable
    >
      {previewString(value, 200)}
    </AppText>
  );
});
