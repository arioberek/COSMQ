import { Ionicons } from "@expo/vector-icons";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView } from "react-native";
import { Text, useTheme as useTamaguiTheme, XStack, YStack } from "tamagui";
import { formatQueryError } from "../../lib/errors";
import { useHaptic } from "../../lib/haptics";
import type {
  ColumnInfo,
  DatabaseConnection,
  DatabaseType,
  TableInfo,
} from "../../lib/types";
import {
  emptyMongoBuilderState,
  emptySqlBuilderState,
  isSqlType,
  type MongoBuilderState,
  mongoBuilderToString,
  type SqlBuilderState,
  sqlBuilderToString,
} from "./builder-state";
import { MongoBuilder } from "./MongoBuilder";
import { PickerSheet } from "./PickerSheet";
import { SqlBuilder } from "./SqlBuilder";

type BuilderViewProps = {
  connectionId: string;
  type: DatabaseType;
  instance: DatabaseConnection;
  onQueryChange: (query: string) => void;
};

const buildTableKey = (schema: string | undefined, name: string): string =>
  schema && schema !== "public" ? `${schema}.${name}` : name;

export const BuilderView = memo(function BuilderView({
  connectionId,
  type,
  instance,
  onQueryChange,
}: BuilderViewProps) {
  const tamagui = useTamaguiTheme();
  const haptic = useHaptic();

  const [tables, setTables] = useState<TableInfo[]>([]);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [loadingColumns, setLoadingColumns] = useState(false);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sql = isSqlType(type);
  const [sqlState, setSqlState] = useState<SqlBuilderState>(emptySqlBuilderState);
  const [mongoState, setMongoState] = useState<MongoBuilderState>(emptyMongoBuilderState);

  // Reset builder state when the connection changes.
  const lastConnRef = useRef<string | null>(null);
  useEffect(() => {
    if (lastConnRef.current !== connectionId) {
      lastConnRef.current = connectionId;
      setSqlState(emptySqlBuilderState());
      setMongoState(emptyMongoBuilderState());
      setTables([]);
      setColumns([]);
      setError(null);
    }
  }, [connectionId]);

  const loadTables = useCallback(async () => {
    setLoadingTables(true);
    setError(null);
    try {
      const list = await instance.listTables();
      setTables(list);
    } catch (err) {
      setError(formatQueryError(err, type));
    } finally {
      setLoadingTables(false);
    }
  }, [instance, type]);

  // Initial load of tables when entering the builder.
  useEffect(() => {
    if (tables.length === 0 && !loadingTables) {
      loadTables();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionId]);

  const loadColumns = useCallback(
    async (schema: string | undefined, table: string) => {
      setLoadingColumns(true);
      try {
        const cols = await instance.describeTable(schema, table);
        setColumns(cols);
      } catch (err) {
        setError(formatQueryError(err, type));
        setColumns([]);
      } finally {
        setLoadingColumns(false);
      }
    },
    [instance, type],
  );

  // Auto-load columns whenever the table/collection changes.
  useEffect(() => {
    if (sql) {
      const t = sqlState.table;
      if (t) loadColumns(t.schema, t.name);
      else setColumns([]);
    } else {
      const c = mongoState.collection;
      if (c) loadColumns(undefined, c);
      else setColumns([]);
    }
  }, [
    sql,
    sqlState.table?.schema,
    sqlState.table?.name,
    mongoState.collection,
    loadColumns,
  ]);

  // Live-emit the generated query string.
  const generatedQuery = useMemo(() => {
    if (sql) return sqlBuilderToString(sqlState, type);
    return mongoBuilderToString(mongoState);
  }, [sql, sqlState, mongoState, type]);

  useEffect(() => {
    onQueryChange(generatedQuery);
  }, [generatedQuery, onQueryChange]);

  const handlePickTable = useCallback(
    (id: string) => {
      const picked = tables.find((t) => buildTableKey(t.schema, t.name) === id);
      if (!picked) return;
      haptic.light();
      if (sql) {
        setSqlState((prev) => ({
          ...emptySqlBuilderState(),
          limit: prev.limit,
          table: { schema: picked.schema, name: picked.name },
        }));
      } else {
        setMongoState((prev) => ({
          ...emptyMongoBuilderState(),
          limit: prev.limit,
          collection: picked.name,
        }));
      }
    },
    [tables, sql, haptic],
  );

  const tableOptions = useMemo(
    () =>
      tables.map((t) => ({
        id: buildTableKey(t.schema, t.name),
        label: t.name,
        sublabel: t.schema && t.schema !== "public" ? `${t.schema} · ${t.type}` : t.type,
      })),
    [tables],
  );

  const currentTableId = sql
    ? sqlState.table
      ? buildTableKey(sqlState.table.schema, sqlState.table.name)
      : null
    : (mongoState.collection ?? null);

  return (
    <YStack gap="$md" flex={1}>
      <XStack alignItems="center" justifyContent="space-between">
        <Text
          color="$placeholderColor"
          fontSize={11}
          fontFamily="$mono"
          letterSpacing={0.4}
        >
          {sql ? "SQL builder" : "MongoDB builder"}
        </Text>
        <Pressable hitSlop={6} onPress={loadTables} disabled={loadingTables}>
          <XStack
            alignItems="center"
            gap={4}
            paddingHorizontal={8}
            paddingVertical={4}
            borderRadius={999}
            backgroundColor="$surfaceMuted"
          >
            <Ionicons
              name="refresh"
              size={11}
              color={tamagui.placeholderColor.val}
            />
            <Text color="$placeholderColor" fontSize={11} fontWeight="600">
              {loadingTables ? "Loading…" : "Refresh"}
            </Text>
          </XStack>
        </Pressable>
      </XStack>

      {error ? (
        <XStack
          paddingHorizontal="$sm"
          paddingVertical="$sm"
          borderRadius="$sm"
          backgroundColor="$dangerMuted"
          borderWidth={1}
          borderColor="$danger"
        >
          <Text color="$danger" fontSize={12} flex={1}>
            {error}
          </Text>
        </XStack>
      ) : null}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <YStack gap="$md">
          {sql ? (
            <SqlBuilder
              state={sqlState}
              onChange={setSqlState}
              type={type}
              tables={tables}
              columns={columns}
              loadingTables={loadingTables}
              onPickTable={() => setShowTablePicker(true)}
            />
          ) : (
            <MongoBuilder
              state={mongoState}
              onChange={setMongoState}
              collections={tables}
              fields={columns}
              loadingCollections={loadingTables}
              onPickCollection={() => setShowTablePicker(true)}
            />
          )}

          <YStack gap={6}>
            <XStack alignItems="center" justifyContent="space-between">
              <Text
                color="$placeholderColor"
                fontSize={11}
                fontFamily="$mono"
                textTransform="uppercase"
                letterSpacing={0.5}
                fontWeight="700"
              >
                Preview
              </Text>
              {loadingColumns ? (
                <Text color="$placeholderColor" fontSize={10}>
                  loading columns…
                </Text>
              ) : null}
            </XStack>
            <YStack
              backgroundColor="$surface"
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$sm"
              padding={10}
              minHeight={64}
            >
              {generatedQuery ? (
                <Text
                  color="$color"
                  fontSize={12}
                  fontFamily="$mono"
                  selectable
                >
                  {generatedQuery}
                </Text>
              ) : (
                <Text color="$placeholderColor" fontSize={12}>
                  {sql
                    ? "Pick a table to start building."
                    : "Pick a collection to start building."}
                </Text>
              )}
            </YStack>
          </YStack>
        </YStack>
      </ScrollView>

      <PickerSheet
        open={showTablePicker}
        onOpenChange={setShowTablePicker}
        title={sql ? "Pick a table" : "Pick a collection"}
        options={tableOptions}
        selected={currentTableId ? [currentTableId] : []}
        emptyText={
          loadingTables ? "Loading…" : "No tables found. Tap Refresh."
        }
        onSelect={(ids) => {
          if (ids.length > 0) handlePickTable(ids[0]);
        }}
      />
    </YStack>
  );
});
