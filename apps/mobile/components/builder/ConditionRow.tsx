import { Ionicons } from "@expo/vector-icons";
import { memo, useState } from "react";
import { Pressable } from "react-native";
import { useTheme as useTamaguiTheme, XStack, YStack } from "tamagui";
import { useHaptic } from "../../lib/haptics";
import type { ColumnInfo } from "../../lib/types";
import { Input } from "../ui/Input";
import { BuilderChip } from "./BuilderSection";
import { PickerSheet } from "./PickerSheet";

type ConditionRowProps = {
  index: number;
  combinator?: "AND" | "OR";
  onCombinatorChange?: (next: "AND" | "OR") => void;
  column: string;
  onColumnChange: (column: string) => void;
  columns: ColumnInfo[];
  operator: string;
  onOperatorChange: (op: string) => void;
  operators: string[];
  value: string;
  onValueChange: (value: string) => void;
  hideValue: boolean;
  valuePlaceholder?: string;
  onRemove: () => void;
};

/**
 * One filter condition as a compact grouped row: chips for combinator,
 * column and operator on the first line, the value field below.
 */
export const ConditionRow = memo(function ConditionRow({
  index,
  combinator,
  onCombinatorChange,
  column,
  onColumnChange,
  columns,
  operator,
  onOperatorChange,
  operators,
  value,
  onValueChange,
  hideValue,
  valuePlaceholder,
  onRemove,
}: ConditionRowProps) {
  const tamagui = useTamaguiTheme();
  const haptic = useHaptic();
  const [showColumns, setShowColumns] = useState(false);
  const [showOps, setShowOps] = useState(false);

  return (
    <YStack gap="$sm" paddingHorizontal="$md" paddingVertical={10}>
      <XStack alignItems="center" gap={6}>
        {index > 0 && combinator ? (
          <BuilderChip
            label={combinator}
            tone="accent"
            accessibilityLabel={`Combine with ${combinator}. Tap to switch.`}
            onPress={() => {
              haptic.light();
              onCombinatorChange?.(combinator === "AND" ? "OR" : "AND");
            }}
          />
        ) : null}
        <BuilderChip
          label={column}
          placeholder="Column"
          chevron
          shrink
          accessibilityLabel={column ? `Column ${column}` : "Choose column"}
          onPress={() => setShowColumns(true)}
        />
        <BuilderChip
          label={operator}
          tone="accent"
          chevron
          accessibilityLabel={`Operator ${operator}`}
          onPress={() => setShowOps(true)}
        />
        <YStack flex={1} />
        <Pressable
          onPress={() => {
            haptic.light();
            onRemove();
          }}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Remove condition"
        >
          <Ionicons name="close-circle" size={22} color={tamagui.textSubtle.val} />
        </Pressable>
      </XStack>

      {hideValue ? null : (
        <XStack
          height={36}
          alignItems="center"
          paddingHorizontal={10}
          borderRadius="$sm"
          backgroundColor="$fill"
          style={{ borderCurve: "continuous" }}
        >
          <Input
            mono
            value={value}
            onChangeText={onValueChange}
            placeholder={valuePlaceholder ?? "value"}
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Value"
            style={{ paddingVertical: 0, height: 36 }}
          />
        </XStack>
      )}

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

      <PickerSheet
        open={showOps}
        onOpenChange={setShowOps}
        title="Operator"
        options={operators.map((o) => ({ id: o, label: o }))}
        selected={[operator]}
        searchable={false}
        onSelect={(ids) => {
          if (ids.length > 0) onOperatorChange(ids[0]);
        }}
      />
    </YStack>
  );
});
