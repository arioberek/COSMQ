import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable } from "react-native";
import { useTheme as useTamaguiTheme, XStack, YStack } from "tamagui";
import { useHaptic } from "../../lib/haptics";
import type { ColumnInfo } from "../../lib/types";
import { Segmented } from "../results/Segmented";
import { BuilderChip } from "./BuilderSection";
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
    <XStack alignItems="center" gap="$sm" paddingHorizontal="$md" paddingVertical={10}>
      <BuilderChip
        label={column}
        placeholder="Column"
        chevron
        shrink
        accessibilityLabel={column ? `Sort column ${column}` : "Choose sort column"}
        onPress={() => setShowColumns(true)}
      />
      <YStack flex={1} />
      <Segmented
        values={[ascLabel, descLabel]}
        selectedIndex={dir === descValue ? 1 : 0}
        onChange={(index) => {
          haptic.light();
          onDirChange(index === 1 ? descValue : ascValue);
        }}
        style={{ width: 124 }}
        accessibilityLabel="Sort direction"
      />
      <Pressable
        onPress={() => {
          haptic.light();
          onRemove();
        }}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Remove sort"
      >
        <Ionicons name="close-circle" size={22} color={tamagui.textSubtle.val} />
      </Pressable>

      <PickerSheet
        open={showColumns}
        onOpenChange={setShowColumns}
        title="Column"
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
