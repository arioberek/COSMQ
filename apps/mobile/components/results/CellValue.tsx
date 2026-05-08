import { Ionicons } from "@expo/vector-icons";
import { memo, useEffect, useState } from "react";
import { Pressable } from "react-native";
import { Text, useTheme as useTamaguiTheme, XStack } from "tamagui";
import { useHaptic } from "../../lib/haptics";
import type { ColumnInfo } from "../../lib/types";
import {
  cellKind,
  formatDate,
  formatNumberCompact,
  formatNumberExact,
  previewString,
  truthyBoolean,
} from "./format";

type CellValueProps = {
  column: ColumnInfo;
  value: unknown;
  numberOfLines?: number;
  onJsonPress?: (value: unknown, column: ColumnInfo) => void;
};

export const CellValue = memo(function CellValue({
  column,
  value,
  numberOfLines = 1,
  onJsonPress,
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

  if (kind === "null") {
    return (
      <Text color="$placeholderColor" fontSize={13}>
        —
      </Text>
    );
  }

  if (kind === "boolean") {
    const truthy = truthyBoolean(value);
    return (
      <Ionicons
        name={truthy ? "checkmark-circle" : "close-circle"}
        size={16}
        color={truthy ? tamagui.success.val : tamagui.placeholderColor.val}
      />
    );
  }

  if (kind === "number") {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) {
      return (
        <Text color="$color" fontSize={13} numberOfLines={numberOfLines} selectable>
          {String(value)}
        </Text>
      );
    }
    const display = showExact ? formatNumberExact(n) : formatNumberCompact(n);
    const isCompact = display !== formatNumberExact(n);
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
        <Text
          color="$color"
          fontSize={13}
          fontFamily="$mono"
          fontVariant={["tabular-nums"]}
          numberOfLines={numberOfLines}
          selectable
        >
          {display}
        </Text>
      </Pressable>
    );
  }

  if (kind === "date") {
    return (
      <Text color="$color" fontSize={13} numberOfLines={numberOfLines} selectable>
        {formatDate(value)}
      </Text>
    );
  }

  if (kind === "json") {
    return (
      <Pressable onPress={() => onJsonPress?.(value, column)} hitSlop={6}>
        <XStack
          alignItems="center"
          gap={4}
          paddingHorizontal={6}
          paddingVertical={2}
          backgroundColor="$surfaceMuted"
          borderRadius="$xs"
          alignSelf="flex-start"
        >
          <Text color="$placeholderColor" fontSize={11} fontFamily="$mono">
            {"{…}"}
          </Text>
          <Text color="$placeholderColor" fontSize={11}>
            JSON
          </Text>
        </XStack>
      </Pressable>
    );
  }

  return (
    <Text color="$color" fontSize={13} numberOfLines={numberOfLines} selectable>
      {previewString(value, 200)}
    </Text>
  );
});
