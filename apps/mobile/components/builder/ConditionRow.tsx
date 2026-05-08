import { Ionicons } from "@expo/vector-icons";
import { memo, useState } from "react";
import { Pressable, TextInput } from "react-native";
import { Text, useTheme as useTamaguiTheme, XStack, YStack } from "tamagui";
import { useHaptic } from "../../lib/haptics";
import type { ColumnInfo } from "../../lib/types";
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
    <YStack gap={6}>
      {index > 0 && combinator ? (
        <XStack gap={6}>
          {(["AND", "OR"] as const).map((c) => {
            const active = combinator === c;
            return (
              <Pressable
                key={c}
                onPress={() => {
                  haptic.light();
                  onCombinatorChange?.(c);
                }}
              >
                <XStack
                  paddingHorizontal={10}
                  paddingVertical={4}
                  borderRadius={999}
                  backgroundColor={active ? "$primaryMuted" : "$surfaceMuted"}
                >
                  <Text
                    color={active ? "$primary" : "$placeholderColor"}
                    fontSize={11}
                    fontWeight="600"
                    fontFamily="$mono"
                  >
                    {c}
                  </Text>
                </XStack>
              </Pressable>
            );
          })}
        </XStack>
      ) : null}

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

        <Pressable onPress={() => setShowOps(true)}>
          <XStack
            paddingHorizontal={8}
            paddingVertical={6}
            borderRadius={6}
            backgroundColor="$primaryMuted"
            alignItems="center"
            gap={4}
          >
            <Text color="$primary" fontSize={12} fontWeight="600" fontFamily="$mono">
              {operator}
            </Text>
            <Ionicons name="chevron-down" size={11} color={tamagui.primary.val} />
          </XStack>
        </Pressable>

        {hideValue ? (
          <YStack flex={1} />
        ) : (
          <XStack
            flex={1}
            paddingHorizontal={8}
            paddingVertical={4}
            borderRadius={6}
            backgroundColor="$surfaceMuted"
          >
            <TextInput
              value={value}
              onChangeText={onValueChange}
              placeholder={valuePlaceholder ?? "value"}
              placeholderTextColor={tamagui.placeholderColor.val}
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                flex: 1,
                color: tamagui.color.val,
                fontSize: 12,
                fontFamily: "JetBrainsMono",
                paddingVertical: 4,
              }}
            />
          </XStack>
        )}

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
      </XStack>

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

      <PickerSheet
        open={showOps}
        onOpenChange={setShowOps}
        title="Pick an operator"
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
