import { Ionicons } from "@expo/vector-icons";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, TextInput } from "react-native";
import { Text, useTheme as useTamaguiTheme, XStack, YStack } from "tamagui";
import { useHaptic } from "../../lib/haptics";
import {
  buildPrefsKey,
  type ColumnPrefs,
  getColumnPrefs,
  getResultsViewMode,
  type ResultsViewMode,
  setColumnPrefs,
  setResultsViewMode,
} from "../../lib/storage/results-prefs";
import type { QueryResult } from "../../lib/types";
import { CardsView } from "./CardsView";
import { resolveColumns } from "./columnPriority";
import { DetailSheet } from "./DetailSheet";
import { ColumnCustomizeSheet } from "./ColumnCustomizeSheet";
import { isNullish, stringifyCell } from "./format";
import { JsonView } from "./JsonView";
import { SortSheet, type SortDir } from "./SortSheet";
import { TableView } from "./TableView";

type ResultsViewProps = {
  result: QueryResult;
  connectionId: string;
  query: string;
  onCopyAll: () => void;
};

const cellSearchString = (value: unknown): string => {
  if (isNullish(value)) return "";
  if (typeof value === "object") return stringifyCell(value).toLowerCase();
  return String(value).toLowerCase();
};

const compareValues = (a: unknown, b: unknown): number => {
  const an = isNullish(a);
  const bn = isNullish(b);
  if (an && bn) return 0;
  if (an) return 1;
  if (bn) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  const as = typeof a === "string" ? a : stringifyCell(a);
  const bs = typeof b === "string" ? b : stringifyCell(b);
  const an2 = Number(as);
  const bn2 = Number(bs);
  if (Number.isFinite(an2) && Number.isFinite(bn2) && as.trim() !== "" && bs.trim() !== "") {
    return an2 - bn2;
  }
  return as.localeCompare(bs, undefined, { numeric: true, sensitivity: "base" });
};

const VIEW_ITEMS: {
  id: ResultsViewMode;
  active: "albums" | "grid" | "code-slash";
  inactive: "albums-outline" | "grid-outline" | "code-slash-outline";
  label: string;
}[] = [
  { id: "cards", active: "albums", inactive: "albums-outline", label: "Cards" },
  { id: "table", active: "grid", inactive: "grid-outline", label: "Table" },
  { id: "json", active: "code-slash", inactive: "code-slash-outline", label: "JSON" },
];

const ViewSwitcher = memo(function ViewSwitcher({
  mode,
  onChange,
}: {
  mode: ResultsViewMode;
  onChange: (mode: ResultsViewMode) => void;
}) {
  const tamagui = useTamaguiTheme();
  return (
    <XStack
      backgroundColor="$surfaceMuted"
      borderRadius={10}
      padding={3}
      gap={2}
      style={{ borderCurve: "continuous" }}
    >
      {VIEW_ITEMS.map((item) => {
        const active = mode === item.id;
        return (
          <Pressable key={item.id} onPress={() => onChange(item.id)} hitSlop={4}>
            <XStack
              paddingHorizontal={10}
              paddingVertical={6}
              borderRadius={8}
              backgroundColor={active ? "$surface" : "transparent"}
              alignItems="center"
              gap={4}
            >
              <Ionicons
                name={active ? item.active : item.inactive}
                size={13}
                color={active ? tamagui.color.val : tamagui.placeholderColor.val}
              />
              <Text
                color={active ? "$color" : "$placeholderColor"}
                fontSize={11}
                fontWeight="600"
              >
                {item.label}
              </Text>
            </XStack>
          </Pressable>
        );
      })}
    </XStack>
  );
});

export const ResultsView = memo(function ResultsView({
  result,
  connectionId,
  query,
  onCopyAll,
}: ResultsViewProps) {
  const tamagui = useTamaguiTheme();
  const haptic = useHaptic();
  const [mode, setMode] = useState<ResultsViewMode>("cards");
  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [prefs, setPrefs] = useState<ColumnPrefs>({ pinned: [], hidden: [] });
  const [showCustomize, setShowCustomize] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [detailRow, setDetailRow] = useState<Record<string, unknown> | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const prefsKey = useMemo(() => buildPrefsKey(connectionId, query), [connectionId, query]);

  // Load mode preference for this connection.
  useEffect(() => {
    let cancelled = false;
    getResultsViewMode(connectionId).then((m) => {
      if (!cancelled && m) setMode(m);
    });
    return () => {
      cancelled = true;
    };
  }, [connectionId]);

  // Load column prefs for this (connection, query) pair.
  useEffect(() => {
    let cancelled = false;
    getColumnPrefs(prefsKey).then((p) => {
      if (!cancelled) setPrefs(p);
    });
    setSortColumn(null);
    setSortDir(null);
    setSearch("");
    return () => {
      cancelled = true;
    };
  }, [prefsKey]);

  const handleModeChange = useCallback(
    (next: ResultsViewMode) => {
      setMode(next);
      haptic.light();
      setResultsViewMode(connectionId, next).catch(() => {});
    },
    [connectionId, haptic],
  );

  const handlePrefsChange = useCallback(
    (next: ColumnPrefs) => {
      setPrefs(next);
      setColumnPrefs(prefsKey, next).catch(() => {});
    },
    [prefsKey],
  );

  const handlePrefsReset = useCallback(() => {
    handlePrefsChange({ pinned: [], hidden: [] });
  }, [handlePrefsChange]);

  const resolved = useMemo(
    () => resolveColumns(result.columns, result.rows, prefs.pinned, prefs.hidden, 3),
    [result.columns, result.rows, prefs.pinned, prefs.hidden],
  );

  const filteredRows = useMemo(() => {
    if (!search.trim()) return result.rows;
    const needle = search.trim().toLowerCase();
    const cols = resolved.visible;
    return result.rows.filter((row) => {
      for (const col of cols) {
        if (cellSearchString(row[col.name]).includes(needle)) return true;
      }
      return false;
    });
  }, [search, result.rows, resolved.visible]);

  const displayRows = useMemo(() => {
    if (!sortColumn || !sortDir) return filteredRows;
    const sorted = [...filteredRows].sort((a, b) =>
      compareValues(a[sortColumn], b[sortColumn]),
    );
    if (sortDir === "desc") sorted.reverse();
    return sorted;
  }, [filteredRows, sortColumn, sortDir]);

  const handleSortChange = useCallback((col: string, dir: SortDir) => {
    setSortColumn(dir === null ? null : col);
    setSortDir(dir);
  }, []);

  const handleSortClear = useCallback(() => {
    setSortColumn(null);
    setSortDir(null);
    setShowSort(false);
  }, []);

  const handleSortSelect = useCallback((col: string, dir: SortDir) => {
    setSortColumn(dir === null ? null : col);
    setSortDir(dir);
  }, []);

  const handleOpenDetail = useCallback((row: Record<string, unknown>) => {
    setDetailRow(row);
    setDetailOpen(true);
  }, []);

  const command = result.command.trim().toUpperCase().split(" ")[0] ?? "";

  if (result.columns.length === 0) {
    return (
      <XStack
        alignItems="center"
        gap="$sm"
        paddingVertical="$lg"
        paddingHorizontal="$xs"
      >
        <Text color="$success" fontSize={18} fontWeight="600">
          ✓
        </Text>
        <Text color="$textMuted" fontSize={14}>
          {result.rowCount > 0
            ? `${result.rowCount.toLocaleString()} row${
                result.rowCount === 1 ? "" : "s"
              } affected`
            : "Query executed successfully"}
        </Text>
      </XStack>
    );
  }

  return (
    <YStack flex={1} gap="$sm">
      <YStack gap="$sm">
        <XStack alignItems="center" justifyContent="space-between" gap="$sm">
          <XStack alignItems="baseline" gap={4} flex={1}>
            <Text color="$color" fontSize={14} fontWeight="600" fontFamily="$mono">
              {result.rowCount.toLocaleString()}
            </Text>
            <Text color="$placeholderColor" fontSize={12}>
              rows
            </Text>
            <Text color="$placeholderColor" fontSize={12}>
              {" · "}
            </Text>
            <Text color="$placeholderColor" fontSize={12} fontFamily="$mono">
              {result.executionTime}ms
            </Text>
            <Text color="$placeholderColor" fontSize={12}>
              {" · "}
            </Text>
            <Text
              color="$placeholderColor"
              fontSize={10}
              fontFamily="$mono"
              fontWeight="600"
              letterSpacing={0.4}
            >
              {command}
            </Text>
          </XStack>
          <ViewSwitcher mode={mode} onChange={handleModeChange} />
        </XStack>

        <XStack alignItems="center" gap="$sm">
          <XStack
            flex={1}
            alignItems="center"
            backgroundColor="$surface"
            borderRadius="$sm"
            borderWidth={1}
            borderColor="$borderColor"
            paddingHorizontal="$sm"
            gap={6}
            height={34}
          >
            <Ionicons name="search" size={13} color={tamagui.placeholderColor.val} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Filter rows…"
              placeholderTextColor={tamagui.placeholderColor.val}
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                flex: 1,
                color: tamagui.color.val,
                fontSize: 13,
                paddingVertical: 0,
              }}
            />
            {search ? (
              <Pressable hitSlop={6} onPress={() => setSearch("")}>
                <Ionicons
                  name="close-circle"
                  size={14}
                  color={tamagui.placeholderColor.val}
                />
              </Pressable>
            ) : null}
          </XStack>
          <Pressable hitSlop={6} onPress={() => setShowSort(true)}>
            <YStack
              width={34}
              height={34}
              borderRadius={8}
              backgroundColor={sortColumn ? "$primaryMuted" : "$surfaceMuted"}
              alignItems="center"
              justifyContent="center"
            >
              <Ionicons
                name="swap-vertical"
                size={15}
                color={sortColumn ? tamagui.primary.val : tamagui.placeholderColor.val}
              />
            </YStack>
          </Pressable>
          <Pressable hitSlop={6} onPress={() => setShowCustomize(true)}>
            <YStack
              width={34}
              height={34}
              borderRadius={8}
              backgroundColor={
                prefs.pinned.length + prefs.hidden.length > 0 ? "$primaryMuted" : "$surfaceMuted"
              }
              alignItems="center"
              justifyContent="center"
            >
              <Ionicons
                name="options-outline"
                size={16}
                color={
                  prefs.pinned.length + prefs.hidden.length > 0
                    ? tamagui.primary.val
                    : tamagui.placeholderColor.val
                }
              />
            </YStack>
          </Pressable>
          <Pressable hitSlop={6} onPress={onCopyAll}>
            <YStack
              width={34}
              height={34}
              borderRadius={8}
              backgroundColor="$surfaceMuted"
              alignItems="center"
              justifyContent="center"
            >
              <Ionicons name="copy-outline" size={15} color={tamagui.placeholderColor.val} />
            </YStack>
          </Pressable>
        </XStack>
      </YStack>

      <YStack flex={1}>
        {result.rows.length === 0 ? (
          <YStack
            flex={1}
            alignItems="center"
            justifyContent="center"
            padding="$lg"
            gap="$sm"
          >
            <Ionicons name="leaf-outline" size={28} color={tamagui.placeholderColor.val} />
            <Text color="$color" fontSize={15} fontWeight="600">
              No rows returned
            </Text>
            <Text color="$placeholderColor" fontSize={13} textAlign="center">
              The query ran fine — it just didn't match any rows.
            </Text>
          </YStack>
        ) : mode === "cards" ? (
          <CardsView rows={displayRows} resolved={resolved} onOpenDetail={handleOpenDetail} />
        ) : mode === "table" ? (
          <TableView
            rows={displayRows}
            resolved={resolved}
            sortColumn={sortColumn}
            sortDir={sortDir}
            onSortChange={handleSortChange}
          />
        ) : (
          <JsonView rows={displayRows} columns={resolved.visible} />
        )}
      </YStack>

      <DetailSheet
        open={detailOpen}
        onOpenChange={setDetailOpen}
        columns={result.columns}
        row={detailRow}
        title={
          resolved.primary && detailRow
            ? String(detailRow[resolved.primary.name] ?? "Row details")
            : "Row details"
        }
      />

      <ColumnCustomizeSheet
        open={showCustomize}
        onOpenChange={setShowCustomize}
        columns={result.columns}
        prefs={prefs}
        onChange={handlePrefsChange}
        onReset={handlePrefsReset}
      />

      <SortSheet
        open={showSort}
        onOpenChange={setShowSort}
        columns={resolved.visible}
        sortColumn={sortColumn}
        sortDir={sortDir}
        onSelect={handleSortSelect}
        onClear={handleSortClear}
      />
    </YStack>
  );
});
