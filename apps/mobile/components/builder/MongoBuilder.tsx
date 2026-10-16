import { memo, useCallback, useState } from "react";
import { YStack } from "tamagui";
import { useHaptic } from "../../lib/haptics";
import type { ColumnInfo, TableInfo } from "../../lib/types";
import { ListRow } from "../ui/List";
import { BuilderSection, ChipListRow, LimitRow } from "./BuilderSection";
import {
  MONGO_OPERATORS,
  type MongoBuilderState,
  type MongoFilter,
  type MongoOperator,
  type MongoSort,
  newId,
} from "./builder-state";
import { ConditionRow } from "./ConditionRow";
import { PickerSheet } from "./PickerSheet";
import { SortRow } from "./SortRow";

type MongoBuilderProps = {
  state: MongoBuilderState;
  onChange: (next: MongoBuilderState) => void;
  collections: TableInfo[];
  fields: ColumnInfo[];
  loadingCollections: boolean;
  onPickCollection: () => void;
};

const placeholderForOperator = (op: MongoOperator): string => {
  switch (op) {
    case "$in":
    case "$nin":
      return "a, b, c";
    case "$exists":
      return "true / false";
    case "$regex":
      return "^pattern";
    default:
      return "value";
  }
};

export const MongoBuilder = memo(function MongoBuilder({
  state,
  onChange,
  fields,
  loadingCollections,
  collections,
  onPickCollection,
}: MongoBuilderProps) {
  const haptic = useHaptic();
  const [showProjection, setShowProjection] = useState(false);

  const updateFilter = useCallback(
    (id: string, patch: Partial<MongoFilter>) => {
      onChange({
        ...state,
        filters: state.filters.map((f) => (f.id === id ? { ...f, ...patch } : f)),
      });
    },
    [state, onChange],
  );

  const removeFilter = useCallback(
    (id: string) => onChange({ ...state, filters: state.filters.filter((f) => f.id !== id) }),
    [state, onChange],
  );

  const addFilter = useCallback(() => {
    haptic.light();
    const f: MongoFilter = {
      id: newId(),
      field: fields[0]?.name ?? "",
      operator: "$eq",
      value: "",
    };
    onChange({ ...state, filters: [...state.filters, f] });
  }, [state, onChange, fields, haptic]);

  const updateSort = useCallback(
    (id: string, patch: Partial<MongoSort>) =>
      onChange({
        ...state,
        sort: state.sort.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      }),
    [state, onChange],
  );

  const removeSort = useCallback(
    (id: string) => onChange({ ...state, sort: state.sort.filter((s) => s.id !== id) }),
    [state, onChange],
  );

  const addSort = useCallback(() => {
    haptic.light();
    const s: MongoSort = { id: newId(), field: fields[0]?.name ?? "", dir: 1 };
    onChange({ ...state, sort: [...state.sort, s] });
  }, [state, onChange, fields, haptic]);

  const updateLimit = useCallback(
    (text: string) => {
      // Empty input clears the limit. `0` is meaningful in MongoDB (no
      // server-side cap) so accept any non-negative integer.
      if (text.trim() === "") {
        onChange({ ...state, limit: null });
        return;
      }
      const n = parseInt(text, 10);
      onChange({ ...state, limit: Number.isFinite(n) && n >= 0 ? n : null });
    },
    [state, onChange],
  );

  const collectionsEmpty = collections.length === 0 && !loadingCollections;

  return (
    <YStack gap={28}>
      <BuilderSection
        title="Collection"
        footer={
          collectionsEmpty ? "No collections loaded yet. Tap Refresh to load them." : undefined
        }
      >
        <ListRow
          title="Collection"
          value={state.collection ?? "None"}
          accessory="chevron"
          onPress={onPickCollection}
        />
      </BuilderSection>

      <BuilderSection title="Projection">
        <ListRow
          title="Fields"
          value={state.projection.length === 0 ? "All" : `${state.projection.length} Kept`}
          accessory="chevron"
          onPress={() => setShowProjection(true)}
        />
        {state.projection.length > 0 ? (
          <ChipListRow
            items={state.projection}
            onRemove={(f) =>
              onChange({ ...state, projection: state.projection.filter((n) => n !== f) })
            }
          />
        ) : null}
      </BuilderSection>

      <BuilderSection
        title="Filter"
        onAdd={addFilter}
        addLabel="Add Condition"
        footer={state.filters.length === 0 ? "No filters. Returns all documents." : undefined}
      >
        {state.filters.map((f, idx) => (
          <ConditionRow
            key={f.id}
            index={idx}
            column={f.field}
            onColumnChange={(c) => updateFilter(f.id, { field: c })}
            columns={fields}
            operator={f.operator}
            onOperatorChange={(o) => updateFilter(f.id, { operator: o as MongoOperator })}
            operators={[...MONGO_OPERATORS]}
            value={f.value}
            onValueChange={(v) => updateFilter(f.id, { value: v })}
            hideValue={false}
            valuePlaceholder={placeholderForOperator(f.operator)}
            onRemove={() => removeFilter(f.id)}
          />
        ))}
      </BuilderSection>

      <BuilderSection
        title="Sort"
        onAdd={addSort}
        addLabel="Add Sort"
        footer={state.sort.length === 0 ? "Server-default order." : undefined}
      >
        {state.sort.map((s) => (
          <SortRow
            key={s.id}
            column={s.field}
            onColumnChange={(c) => updateSort(s.id, { field: c })}
            columns={fields}
            dir={s.dir}
            ascValue={1 as 1 | -1}
            descValue={-1 as 1 | -1}
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
        open={showProjection}
        onOpenChange={setShowProjection}
        title="Fields"
        multi
        options={fields.map((c) => ({ id: c.name, label: c.name, sublabel: c.type }))}
        selected={state.projection}
        emptyText="No fields known. Pick a collection and run a sample query first."
        onSelect={(next) => onChange({ ...state, projection: next })}
      />
    </YStack>
  );
});
