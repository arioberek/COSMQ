import { Ionicons } from "@expo/vector-icons";
import { memo, useCallback, useState } from "react";
import { Pressable, TextInput } from "react-native";
import { Text, useTheme as useTamaguiTheme, XStack, YStack } from "tamagui";
import { useHaptic } from "../../lib/haptics";
import type { ColumnInfo, DatabaseType, TableInfo } from "../../lib/types";
import { BuilderSection } from "./BuilderSection";
import {
  newId,
  SQL_OPERATORS,
  type SqlBuilderState,
  type SqlCombinator,
  type SqlCondition,
  type SqlOperator,
  type SqlSort,
} from "./builder-state";
import { ConditionRow } from "./ConditionRow";
import { PickerSheet } from "./PickerSheet";
import { SortRow } from "./SortRow";

type SqlBuilderProps = {
  state: SqlBuilderState;
  onChange: (next: SqlBuilderState) => void;
  type: DatabaseType;
  tables: TableInfo[];
  columns: ColumnInfo[]; // for the currently picked table
  loadingTables: boolean;
  onPickTable: () => void;
};

const tableLabel = (state: SqlBuilderState): string => {
  if (!state.table) return "Pick a table…";
  return state.table.schema && state.table.schema !== "public"
    ? `${state.table.schema}.${state.table.name}`
    : state.table.name;
};

const isOperatorWithoutValue = (op: SqlOperator) => op === "IS NULL" || op === "IS NOT NULL";

const placeholderForOperator = (op: SqlOperator): string => {
  switch (op) {
    case "IN":
    case "NOT IN":
      return "a, b, c";
    case "BETWEEN":
      return "low, high";
    case "LIKE":
    case "NOT LIKE":
      return "%pattern%";
    default:
      return "value";
  }
};

export const SqlBuilder = memo(function SqlBuilder({
  state,
  onChange,
  tables,
  columns,
  loadingTables,
  onPickTable,
}: SqlBuilderProps) {
  const tamagui = useTamaguiTheme();
  const haptic = useHaptic();
  const [showColumns, setShowColumns] = useState(false);

  const updateCondition = useCallback(
    (id: string, patch: Partial<SqlCondition>) => {
      onChange({
        ...state,
        conditions: state.conditions.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      });
    },
    [state, onChange],
  );

  const removeCondition = useCallback(
    (id: string) => {
      onChange({ ...state, conditions: state.conditions.filter((c) => c.id !== id) });
    },
    [state, onChange],
  );

  const addCondition = useCallback(() => {
    haptic.light();
    const fallback = columns[0]?.name ?? "";
    const cond: SqlCondition = {
      id: newId(),
      combinator: "AND",
      column: fallback,
      operator: "=",
      value: "",
    };
    onChange({ ...state, conditions: [...state.conditions, cond] });
  }, [state, onChange, columns, haptic]);

  const updateSort = useCallback(
    (id: string, patch: Partial<SqlSort>) => {
      onChange({
        ...state,
        sort: state.sort.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      });
    },
    [state, onChange],
  );

  const removeSort = useCallback(
    (id: string) => {
      onChange({ ...state, sort: state.sort.filter((s) => s.id !== id) });
    },
    [state, onChange],
  );

  const addSort = useCallback(() => {
    haptic.light();
    const fallback = columns[0]?.name ?? "";
    const s: SqlSort = { id: newId(), column: fallback, dir: "ASC" };
    onChange({ ...state, sort: [...state.sort, s] });
  }, [state, onChange, columns, haptic]);

  const updateLimit = useCallback(
    (text: string) => {
      // Empty input clears the LIMIT clause (no cap). Any non-negative integer
      // — including `0`, which is valid SQL meaning "return no rows" — is
      // kept verbatim. Negative values fall back to null.
      if (text.trim() === "") {
        onChange({ ...state, limit: null });
        return;
      }
      const n = parseInt(text, 10);
      onChange({ ...state, limit: Number.isFinite(n) && n >= 0 ? n : null });
    },
    [state, onChange],
  );

  const setColumns = useCallback(
    (next: string[]) => onChange({ ...state, columns: next }),
    [state, onChange],
  );

  const tablesEmpty = tables.length === 0 && !loadingTables;

  return (
    <YStack gap="$md">
      <BuilderSection title="From">
        <Pressable onPress={onPickTable}>
          <XStack
            alignItems="center"
            backgroundColor="$surface"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$sm"
            paddingHorizontal="$sm"
            paddingVertical="$sm"
            gap="$sm"
          >
            <Ionicons name="server-outline" size={14} color={tamagui.placeholderColor.val} />
            <Text
              color={state.table ? "$color" : "$placeholderColor"}
              fontSize={14}
              fontFamily="$mono"
              flex={1}
              numberOfLines={1}
            >
              {tablesEmpty ? "Tap Refresh in the editor to load tables" : tableLabel(state)}
            </Text>
            <Ionicons name="chevron-forward" size={13} color={tamagui.placeholderColor.val} />
          </XStack>
        </Pressable>
      </BuilderSection>

      <BuilderSection
        title="Select"
        hint={state.columns.length === 0 ? "all columns" : `${state.columns.length} picked`}
        onAdd={() => setShowColumns(true)}
        addLabel="Pick"
      >
        <Pressable onPress={() => setShowColumns(true)}>
          <XStack
            flexWrap="wrap"
            gap={6}
            backgroundColor="$surface"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$sm"
            paddingHorizontal="$sm"
            paddingVertical="$sm"
            minHeight={40}
            alignItems="center"
          >
            {state.columns.length === 0 ? (
              <XStack
                paddingHorizontal={10}
                paddingVertical={4}
                borderRadius={999}
                backgroundColor="$primaryMuted"
              >
                <Text color="$primary" fontSize={12} fontWeight="600" fontFamily="$mono">
                  *
                </Text>
              </XStack>
            ) : (
              state.columns.map((c) => (
                <XStack
                  key={c}
                  paddingHorizontal={10}
                  paddingVertical={4}
                  borderRadius={999}
                  backgroundColor="$surfaceMuted"
                  alignItems="center"
                  gap={4}
                >
                  <Text color="$color" fontSize={12} fontFamily="$mono">
                    {c}
                  </Text>
                  <Pressable
                    hitSlop={6}
                    onPress={(e) => {
                      e.stopPropagation();
                      setColumns(state.columns.filter((n) => n !== c));
                    }}
                  >
                    <Ionicons name="close" size={12} color={tamagui.placeholderColor.val} />
                  </Pressable>
                </XStack>
              ))
            )}
          </XStack>
        </Pressable>
      </BuilderSection>

      <BuilderSection title="Where" hint="conditions" onAdd={addCondition}>
        {state.conditions.length === 0 ? (
          <XStack
            paddingHorizontal="$sm"
            paddingVertical="$sm"
            borderRadius="$sm"
            backgroundColor="$surfaceMuted"
            borderWidth={1}
            borderColor="$borderColor"
            borderStyle="dashed"
          >
            <Text color="$placeholderColor" fontSize={12}>
              No filters. Returns all rows.
            </Text>
          </XStack>
        ) : (
          <YStack gap={6}>
            {state.conditions.map((cond, idx) => {
              const op = cond.operator as SqlOperator;
              return (
                <ConditionRow
                  key={cond.id}
                  index={idx}
                  combinator={cond.combinator}
                  onCombinatorChange={(c) =>
                    updateCondition(cond.id, { combinator: c as SqlCombinator })
                  }
                  column={cond.column}
                  onColumnChange={(c) => updateCondition(cond.id, { column: c })}
                  columns={columns}
                  operator={cond.operator}
                  onOperatorChange={(o) => updateCondition(cond.id, { operator: o as SqlOperator })}
                  operators={[...SQL_OPERATORS]}
                  value={cond.value}
                  onValueChange={(v) => updateCondition(cond.id, { value: v })}
                  hideValue={isOperatorWithoutValue(op)}
                  valuePlaceholder={placeholderForOperator(op)}
                  onRemove={() => removeCondition(cond.id)}
                />
              );
            })}
          </YStack>
        )}
      </BuilderSection>

      <BuilderSection title="Order by" onAdd={addSort}>
        {state.sort.length === 0 ? (
          <XStack
            paddingHorizontal="$sm"
            paddingVertical="$sm"
            borderRadius="$sm"
            backgroundColor="$surfaceMuted"
            borderWidth={1}
            borderColor="$borderColor"
            borderStyle="dashed"
          >
            <Text color="$placeholderColor" fontSize={12}>
              Unordered.
            </Text>
          </XStack>
        ) : (
          <YStack gap={6}>
            {state.sort.map((s) => (
              <SortRow
                key={s.id}
                column={s.column}
                onColumnChange={(c) => updateSort(s.id, { column: c })}
                columns={columns}
                dir={s.dir}
                ascValue="ASC"
                descValue="DESC"
                ascLabel="ASC"
                descLabel="DESC"
                onDirChange={(d) => updateSort(s.id, { dir: d })}
                onRemove={() => removeSort(s.id)}
              />
            ))}
          </YStack>
        )}
      </BuilderSection>

      <BuilderSection title="Limit">
        <XStack
          alignItems="center"
          backgroundColor="$surface"
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius="$sm"
          paddingHorizontal="$sm"
          paddingVertical={4}
          gap="$sm"
        >
          <TextInput
            value={state.limit ? String(state.limit) : ""}
            onChangeText={updateLimit}
            placeholder="No limit"
            placeholderTextColor={tamagui.placeholderColor.val}
            keyboardType="number-pad"
            style={{
              flex: 1,
              color: tamagui.color.val,
              fontSize: 14,
              fontFamily: "JetBrainsMono",
              paddingVertical: 6,
            }}
          />
          {state.limit ? (
            <Pressable hitSlop={6} onPress={() => onChange({ ...state, limit: null })}>
              <Ionicons name="close-circle" size={14} color={tamagui.placeholderColor.val} />
            </Pressable>
          ) : null}
        </XStack>
      </BuilderSection>

      <PickerSheet
        open={showColumns}
        onOpenChange={setShowColumns}
        title="Pick columns"
        multi
        options={columns.map((c) => ({ id: c.name, label: c.name, sublabel: c.type }))}
        selected={state.columns}
        emptyText="No columns. Pick a table first."
        onSelect={setColumns}
      />
    </YStack>
  );
});
