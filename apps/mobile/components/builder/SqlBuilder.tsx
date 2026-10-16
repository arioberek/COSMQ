import { memo, useCallback, useState } from "react";
import { YStack } from "tamagui";
import { useHaptic } from "../../lib/haptics";
import type { ColumnInfo, DatabaseType, TableInfo } from "../../lib/types";
import { ListRow } from "../ui/List";
import { BuilderSection, ChipListRow, LimitRow } from "./BuilderSection";
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
    <YStack gap={28}>
      <BuilderSection
        title="From"
        footer={
          tablesEmpty ? "No tables found. Create one in SQL mode, then tap Refresh." : undefined
        }
      >
        <ListRow
          title="Table"
          value={state.table ? tableLabel(state) : "None"}
          accessory="chevron"
          onPress={onPickTable}
        />
      </BuilderSection>

      <BuilderSection title="Select">
        <ListRow
          title="Columns"
          value={state.columns.length === 0 ? "All" : `${state.columns.length} Selected`}
          accessory="chevron"
          onPress={() => setShowColumns(true)}
        />
        {state.columns.length > 0 ? (
          <ChipListRow
            items={state.columns}
            onRemove={(c) => setColumns(state.columns.filter((n) => n !== c))}
          />
        ) : null}
      </BuilderSection>

      <BuilderSection
        title="Where"
        onAdd={addCondition}
        addLabel="Add Condition"
        footer={state.conditions.length === 0 ? "No filters. Returns all rows." : undefined}
      >
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
      </BuilderSection>

      <BuilderSection
        title="Order By"
        onAdd={addSort}
        addLabel="Add Sort"
        footer={
          state.sort.length === 0 ? "Unordered. Rows come back in database order." : undefined
        }
      >
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
      </BuilderSection>

      <BuilderSection title="Limit">
        <LimitRow
          value={state.limit}
          onChangeText={updateLimit}
          onClear={() => onChange({ ...state, limit: null })}
        />
      </BuilderSection>

      <PickerSheet
        open={showColumns}
        onOpenChange={setShowColumns}
        title="Columns"
        multi
        options={columns.map((c) => ({ id: c.name, label: c.name, sublabel: c.type }))}
        selected={state.columns}
        emptyText="No columns. Pick a table first."
        onSelect={setColumns}
      />
    </YStack>
  );
});
