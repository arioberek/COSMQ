import { Ionicons } from "@expo/vector-icons";
import { memo, useCallback, useState } from "react";
import { Pressable, TextInput } from "react-native";
import { Text, useTheme as useTamaguiTheme, XStack, YStack } from "tamagui";
import { useHaptic } from "../../lib/haptics";
import type { ColumnInfo, TableInfo } from "../../lib/types";
import { BuilderSection } from "./BuilderSection";
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
  const tamagui = useTamaguiTheme();
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
    <YStack gap="$md">
      <BuilderSection title="Collection">
        <Pressable onPress={onPickCollection}>
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
            <Ionicons name="folder-outline" size={14} color={tamagui.placeholderColor.val} />
            <Text
              color={state.collection ? "$color" : "$placeholderColor"}
              fontSize={14}
              fontFamily="$mono"
              flex={1}
              numberOfLines={1}
            >
              {collectionsEmpty
                ? "Tap Refresh in the editor to load collections"
                : (state.collection ?? "Pick a collection…")}
            </Text>
            <Ionicons name="chevron-forward" size={13} color={tamagui.placeholderColor.val} />
          </XStack>
        </Pressable>
      </BuilderSection>

      <BuilderSection
        title="Projection"
        hint={state.projection.length === 0 ? "all fields" : `${state.projection.length} kept`}
        onAdd={() => setShowProjection(true)}
        addLabel="Pick"
      >
        <Pressable onPress={() => setShowProjection(true)}>
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
            {state.projection.length === 0 ? (
              <XStack
                paddingHorizontal={10}
                paddingVertical={4}
                borderRadius={999}
                backgroundColor="$primaryMuted"
              >
                <Text color="$primary" fontSize={12} fontWeight="600" fontFamily="$mono">
                  all fields
                </Text>
              </XStack>
            ) : (
              state.projection.map((f) => (
                <XStack
                  key={f}
                  paddingHorizontal={10}
                  paddingVertical={4}
                  borderRadius={999}
                  backgroundColor="$surfaceMuted"
                  alignItems="center"
                  gap={4}
                >
                  <Text color="$color" fontSize={12} fontFamily="$mono">
                    {f}
                  </Text>
                  <Pressable
                    hitSlop={6}
                    onPress={(e) => {
                      e.stopPropagation();
                      onChange({ ...state, projection: state.projection.filter((n) => n !== f) });
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

      <BuilderSection title="Filter" hint="conditions" onAdd={addFilter}>
        {state.filters.length === 0 ? (
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
              No filters. Returns all documents.
            </Text>
          </XStack>
        ) : (
          <YStack gap={6}>
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
          </YStack>
        )}
      </BuilderSection>

      <BuilderSection title="Sort" onAdd={addSort}>
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
              Server-default order.
            </Text>
          </XStack>
        ) : (
          <YStack gap={6}>
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
        open={showProjection}
        onOpenChange={setShowProjection}
        title="Project fields"
        multi
        options={fields.map((c) => ({ id: c.name, label: c.name, sublabel: c.type }))}
        selected={state.projection}
        emptyText="No fields known. Pick a collection and run a sample query first."
        onSelect={(next) => onChange({ ...state, projection: next })}
      />
    </YStack>
  );
});
