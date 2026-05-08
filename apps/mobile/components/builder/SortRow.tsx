import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable } from "react-native";
import { Text, useTheme as useTamaguiTheme, XStack, YStack } from "tamagui";
import { useHaptic } from "../../lib/haptics";
import type { ColumnInfo } from "../../lib/types";
import { PickerSheet } from "./PickerSheet";

type SortRowProps<Dir extends string | number> = {
  column: string;
  onColumnChange: (column: string) => void;
  columns: ColumnInfo[];
  dir: Dir;
  ascValue: Dir;
  descValue: Dir;
  ascLabel: string;
  descLabel: string;
  onDirChange: (dir: Dir) => void;
  onRemove: () => void;
};

export function SortRow<Dir extends string | number>({
  column,
  onColumnChange,
  columns,
  dir,
  ascValue,
  descValue,
  ascLabel,
  descLabel,
  onDirChange,
  onRemove,
}: SortRowProps<Dir>) {
  const tamagui = useTamaguiTheme();
  const haptic = useHaptic();
  const [showColumns, setShowColumns] = useState(false);

  return (
    <XStack
      gap={6}
      alignItems="center"
      backgroundColor="$surface"
      borderWidth={1}
      borderColor="$borderColor"
      borderRadius="$sm"
      padding={6}
    >
      <Pressable onPress={() => setShowColumns(true)} style={{ flex: 1 }}>
        <XStack
          paddingHorizontal={8}
          paddingVertical={6}
          borderRadius={6}
          backgroundColor="$surfaceMuted"
          alignItems="center"
          gap={4}
        >
          <Text
            color={column ? "$color" : "$placeholderColor"}
            fontSize={12}
            fontFamily="$mono"
            numberOfLines={1}
            flex={1}
          >
            {column || "column"}
          </Text>
          <Ionicons name="chevron-down" size={11} color={tamagui.placeholderColor.val} />
        </XStack>
      </Pressable>

      <XStack gap={4}>
        <Pressable
          onPress={() => {
            haptic.light();
            onDirChange(ascValue);
          }}
        >
          <XStack
            paddingHorizontal={10}
            paddingVertical={6}
            borderRadius={6}
            backgroundColor={dir === ascValue ? "$primaryMuted" : "$surfaceMuted"}
            alignItems="center"
            gap={4}
          >
            <Ionicons
              name="arrow-up"
              size={11}
              color={dir === ascValue ? tamagui.primary.val : tamagui.placeholderColor.val}
            />
            <Text
              color={dir === ascValue ? "$primary" : "$placeholderColor"}
              fontSize={11}
              fontWeight="600"
            >
              {ascLabel}
            </Text>
          </XStack>
        </Pressable>
        <Pressable
          onPress={() => {
            haptic.light();
            onDirChange(descValue);
          }}
        >
          <XStack
            paddingHorizontal={10}
            paddingVertical={6}
            borderRadius={6}
            backgroundColor={dir === descValue ? "$primaryMuted" : "$surfaceMuted"}
            alignItems="center"
            gap={4}
          >
            <Ionicons
              name="arrow-down"
              size={11}
              color={dir === descValue ? tamagui.primary.val : tamagui.placeholderColor.val}
            />
            <Text
              color={dir === descValue ? "$primary" : "$placeholderColor"}
              fontSize={11}
              fontWeight="600"
            >
              {descLabel}
            </Text>
          </XStack>
        </Pressable>
      </XStack>

      <Pressable
        onPress={() => {
          haptic.light();
          onRemove();
        }}
        hitSlop={6}
      >
        <YStack
          width={26}
          height={26}
          borderRadius={13}
          backgroundColor="$surfaceMuted"
          alignItems="center"
          justifyContent="center"
        >
          <Ionicons name="close" size={13} color={tamagui.placeholderColor.val} />
        </YStack>
      </Pressable>

      <PickerSheet
        open={showColumns}
        onOpenChange={setShowColumns}
        title="Pick a column"
        options={columns.map((c) => ({ id: c.name, label: c.name, sublabel: c.type }))}
        selected={column ? [column] : []}
        onSelect={(ids) => {
          if (ids.length > 0) onColumnChange(ids[0]);
        }}
        emptyText="No columns. Pick a table first."
      />
    </XStack>
  );
}

