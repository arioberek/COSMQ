import { Ionicons } from "@expo/vector-icons";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView } from "react-native";
import { useTheme as useTamaguiTheme, XStack, YStack } from "tamagui";
import { useHaptic } from "../../lib/haptics";
import type { ColumnInfo, DatabaseConnection, DatabaseType, TableInfo } from "../../lib/types";
import { describeConnectionError } from "../../stores/connection";
import { AppText } from "../ui/Text";
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

  // Request tokens guard async metadata calls. A connection switch or a fast
  // table swap can leave earlier `listTables` / `describeTable` promises in
  // flight; their resolutions must not overwrite state belonging to a newer
  // request.
  const tablesReqRef = useRef(0);
  const columnsReqRef = useRef(0);

  // Reset builder state when the connection changes.
  const lastConnRef = useRef<string | null>(null);
  useEffect(() => {
    if (lastConnRef.current !== connectionId) {
      lastConnRef.current = connectionId;
      tablesReqRef.current += 1;
      columnsReqRef.current += 1;
      setSqlState(emptySqlBuilderState());
      setMongoState(emptyMongoBuilderState());
      setTables([]);
      setColumns([]);
      setError(null);
    }
  }, [connectionId]);

  const loadTables = useCallback(async () => {
    const reqId = ++tablesReqRef.current;
    setLoadingTables(true);
    setError(null);
    try {
      const list = await instance.listTables();
      if (tablesReqRef.current !== reqId) return;
      setTables(list);
    } catch (err) {
      if (tablesReqRef.current !== reqId) return;
      setError(describeConnectionError(connectionId, err, type, instance));
    } finally {
      if (tablesReqRef.current === reqId) setLoadingTables(false);
    }
  }, [instance, type, connectionId]);

  // Load tables once per connection when entering the builder. Keying on
  // "already attempted" rather than "list is empty" matters: a database with
  // no tables (or a failed listTables) would otherwise reload forever.
  // Refresh stays available for manual reloads.
  const autoLoadedFor = useRef<string | null>(null);
  useEffect(() => {
    if (autoLoadedFor.current === connectionId) return;
    autoLoadedFor.current = connectionId;
    loadTables();
  }, [connectionId, loadTables]);

  const loadColumns = useCallback(
    async (schema: string | undefined, table: string) => {
      const reqId = ++columnsReqRef.current;
      setColumns([]);
      setLoadingColumns(true);
      try {
        const cols = await instance.describeTable(schema, table);
        if (columnsReqRef.current !== reqId) return;
        setColumns(cols);
      } catch (err) {
        if (columnsReqRef.current !== reqId) return;
        setError(describeConnectionError(connectionId, err, type, instance));
        setColumns([]);
      } finally {
        if (columnsReqRef.current === reqId) setLoadingColumns(false);
      }
    },
    [instance, type, connectionId],
  );

  // Auto-load columns whenever the table/collection changes. Bumping
  // `columnsReqRef` on clear cancels any in-flight describe call so a stale
  // response can't repopulate the picker after the user deselects.
  useEffect(() => {
    if (sql) {
      const t = sqlState.table;
      if (t) loadColumns(t.schema, t.name);
      else {
        columnsReqRef.current += 1;
        setColumns([]);
      }
    } else {
      const c = mongoState.collection;
      if (c) loadColumns(undefined, c);
      else {
        columnsReqRef.current += 1;
        setColumns([]);
      }
    }
  }, [sql, sqlState.table, mongoState.collection, loadColumns]);

  // Live-emit the generated query string.
  const columnTypes = useMemo(
    () => Object.fromEntries(columns.map((c) => [c.name, c.type])),
    [columns],
  );

  const generatedQuery = useMemo(() => {
    if (sql) return sqlBuilderToString(sqlState, type, columnTypes);
    return mongoBuilderToString(mongoState);
  }, [sql, sqlState, mongoState, type, columnTypes]);

  useEffect(() => {
    // A fresh builder has nothing to say yet; don't wipe SQL the user typed
    // in the editor just because they peeked at the builder.
    if (generatedQuery === "") return;
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
      <XStack alignItems="center" justifyContent="space-between" paddingHorizontal="$md">
        <AppText variant="footnote" tone="secondary">
          {sql ? "SQL Builder" : "MongoDB Builder"}
        </AppText>
        <Pressable
          hitSlop={10}
          onPress={loadTables}
          disabled={loadingTables}
          accessibilityRole="button"
          accessibilityLabel={sql ? "Refresh tables" : "Refresh collections"}
          accessibilityState={{ busy: loadingTables }}
          style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
        >
          <XStack alignItems="center" gap={4}>
            {loadingTables ? (
              <ActivityIndicator size="small" color={tamagui.textSubtle.val} />
            ) : (
              <Ionicons name="refresh" size={15} color={tamagui.accent.val} />
            )}
            <AppText variant="subhead" tone={loadingTables ? "tertiary" : "accent"}>
              {loadingTables ? "Loading…" : "Refresh"}
            </AppText>
          </XStack>
        </Pressable>
      </XStack>

      {error ? (
        <YStack
          gap="$sm"
          padding="$md"
          borderRadius="$md"
          backgroundColor="$dangerMuted"
          style={{ borderCurve: "continuous" }}
        >
          <AppText variant="footnote" tone="danger" selectable>
            {error}
          </AppText>
          <Pressable
            onPress={loadTables}
            disabled={loadingTables}
            hitSlop={8}
            accessibilityRole="button"
            style={({ pressed }) => ({ alignSelf: "flex-start", opacity: pressed ? 0.5 : 1 })}
          >
            <AppText variant="subhead" tone="accent" emphasized>
              Try Again
            </AppText>
          </Pressable>
        </YStack>
      ) : null}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <YStack gap={28}>
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
            <XStack alignItems="baseline" justifyContent="space-between" paddingHorizontal="$md">
              <AppText variant="footnote" tone="secondary" textTransform="uppercase">
                Preview
              </AppText>
              {loadingColumns ? (
                <AppText variant="footnote" tone="tertiary">
                  Loading columns…
                </AppText>
              ) : null}
            </XStack>
            <YStack
              backgroundColor="$surface"
              borderRadius="$md"
              padding="$md"
              minHeight={64}
              style={{ borderCurve: "continuous" }}
            >
              {generatedQuery ? (
                <AppText variant="code" selectable>
                  {generatedQuery}
                </AppText>
              ) : (
                <AppText variant="footnote" tone="secondary">
                  {sql ? "Pick a table to start building." : "Pick a collection to start building."}
                </AppText>
              )}
            </YStack>
          </YStack>
        </YStack>
      </ScrollView>

      <PickerSheet
        open={showTablePicker}
        onOpenChange={setShowTablePicker}
        title={sql ? "Table" : "Collection"}
        options={tableOptions}
        selected={currentTableId ? [currentTableId] : []}
        emptyText={loadingTables ? "Loading…" : "No tables found. Tap Refresh."}
        onSelect={(ids) => {
          if (ids.length > 0) handlePickTable(ids[0]);
        }}
      />
    </YStack>
  );
});
