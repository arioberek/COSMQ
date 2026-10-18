import { Ionicons } from "@expo/vector-icons";
import { memo, useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";
import type { ColumnInfo, DatabaseConnection, DatabaseType, TableInfo } from "../../lib/types";
import { describeConnectionError } from "../../stores/connection";
import { AppText } from "../ui";

type SchemaSource = { id: string; instance: DatabaseConnection; type: DatabaseType } | null;

/** Table list and lazily described columns for the tables panel. */
export function useSchemaBrowser(
  source: SchemaSource,
  showAlert: (title: string, message: string) => void,
) {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [expandedTable, setExpandedTable] = useState<string | null>(null);
  const [tableColumns, setTableColumns] = useState<Record<string, ColumnInfo[]>>({});
  const [loading, setLoading] = useState(false);

  const loadTables = useCallback(async () => {
    if (!source) return;
    setLoading(true);
    try {
      setTables(await source.instance.listTables());
    } catch (err) {
      showAlert(
        "Couldn’t Load Tables",
        describeConnectionError(source.id, err, source.type, source.instance),
      );
    } finally {
      setLoading(false);
    }
  }, [source, showAlert]);

  const toggleTable = useCallback(
    async (tableName: string) => {
      if (!source) return;
      if (expandedTable === tableName) {
        setExpandedTable(null);
        return;
      }
      if (tableColumns[tableName]) {
        setExpandedTable(tableName);
        return;
      }
      try {
        const table = tables.find((t) => t.name === tableName);
        const columns = await source.instance.describeTable(table?.schema || "public", tableName);
        setTableColumns((prev) => ({ ...prev, [tableName]: columns }));
        setExpandedTable(tableName);
      } catch (err) {
        showAlert(
          "Couldn’t Load Columns",
          describeConnectionError(source.id, err, source.type, source.instance),
        );
      }
    },
    [source, expandedTable, tableColumns, tables, showAlert],
  );

  return { tables, expandedTable, tableColumns, loading, loadTables, toggleTable };
}

type TablesPanelProps = ReturnType<typeof useSchemaBrowser> & {
  /** Appends a table or column name to the query. */
  onInsert: (text: string) => void;
};

function PanelRow({
  onPress,
  onLongPress,
  showSeparator,
  indent,
  accessibilityLabel,
  children,
}: {
  onPress: () => void;
  onLongPress?: () => void;
  showSeparator: boolean;
  indent?: boolean;
  accessibilityLabel: string;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => ({
        backgroundColor: pressed ? theme.surfaceMuted.val : "transparent",
      })}
    >
      <XStack paddingLeft={indent ? 40 : "$md"}>
        <XStack
          flex={1}
          minHeight={44}
          alignItems="center"
          gap="$sm"
          paddingRight="$md"
          borderBottomWidth={showSeparator ? 0.5 : 0}
          borderBottomColor="$borderColor"
        >
          {children}
        </XStack>
      </XStack>
    </Pressable>
  );
}

/**
 * Inline schema browser. Tap a table to show its columns, long-press it to
 * insert its name; tap a column to insert the column name.
 */
export const TablesPanel = memo(function TablesPanel({
  tables,
  expandedTable,
  tableColumns,
  loading,
  loadTables,
  toggleTable,
  onInsert,
}: TablesPanelProps) {
  const theme = useTheme();

  return (
    <YStack gap={6}>
      <XStack alignItems="center" justifyContent="space-between" paddingHorizontal="$md">
        <AppText variant="footnote" tone="secondary" textTransform="uppercase">
          Tables
        </AppText>
        <Pressable
          onPress={loadTables}
          disabled={loading}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Refresh tables"
          style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.textSubtle.val} />
          ) : (
            <AppText variant="footnote" tone="accent">
              Refresh
            </AppText>
          )}
        </Pressable>
      </XStack>
      <YStack
        backgroundColor="$surface"
        borderRadius="$md"
        overflow="hidden"
        maxHeight={240}
        style={{ borderCurve: "continuous" }}
      >
        <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
          {tables.length === 0 ? (
            <AppText
              variant="subhead"
              tone="secondary"
              style={{ textAlign: "center" }}
              padding="$md"
            >
              {loading ? "Loading…" : "No Tables"}
            </AppText>
          ) : null}
          {tables.map((table, index) => {
            const expanded = expandedTable === table.name;
            const columns = expanded ? tableColumns[table.name] : undefined;
            const isLast = index === tables.length - 1;
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: listTables can return duplicate names across schemas
              <YStack key={`${table.schema ?? "_"}-${table.name}-${table.type ?? "_"}-${index}`}>
                <PanelRow
                  onPress={() => toggleTable(table.name)}
                  onLongPress={() => onInsert(table.name)}
                  showSeparator={!isLast || !!columns}
                  accessibilityLabel={`${table.name}, ${table.type ?? "table"}`}
                >
                  <AppText variant="body" flex={1} numberOfLines={1}>
                    {table.name}
                  </AppText>
                  {table.type ? (
                    <AppText variant="footnote" tone="secondary">
                      {table.type}
                    </AppText>
                  ) : null}
                  <Ionicons
                    name={expanded ? "chevron-down" : "chevron-forward"}
                    size={15}
                    color={theme.textSubtle.val}
                  />
                </PanelRow>
                {columns?.map((col, colIndex) => (
                  <PanelRow
                    key={col.name}
                    indent
                    onPress={() => onInsert(col.name)}
                    showSeparator={!isLast || colIndex < columns.length - 1}
                    accessibilityLabel={`Insert column ${col.name}`}
                  >
                    <AppText variant="code" flex={1} numberOfLines={1}>
                      {col.name}
                    </AppText>
                    <AppText variant="caption" tone="tertiary" fontFamily="$mono" numberOfLines={1}>
                      {col.type}
                    </AppText>
                  </PanelRow>
                ))}
              </YStack>
            );
          })}
        </ScrollView>
      </YStack>
      <AppText variant="footnote" tone="secondary" paddingHorizontal="$md">
        Long-press a table or tap a column to insert its name.
      </AppText>
    </YStack>
  );
});
