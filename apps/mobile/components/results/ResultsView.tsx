import { Ionicons } from "@expo/vector-icons";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Pressable } from "react-native";
import { useTheme as useTamaguiTheme, XStack, YStack } from "tamagui";
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
import { EmptyState } from "../ui/EmptyState";
import { AppText } from "../ui/Text";
import { CardsView } from "./CardsView";
import { ColumnCustomizeSheet } from "./ColumnCustomizeSheet";
import { resolveColumns } from "./columnPriority";
import { DetailSheet } from "./DetailSheet";
import { isNullish, stringifyCell } from "./format";
import { JsonView } from "./JsonView";
import { SearchField } from "./SearchField";
import { Segmented } from "./Segmented";
import { type SortDir, SortSheet } from "./SortSheet";
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

const MODES: ResultsViewMode[] = ["cards", "table", "json"];
const MODE_LABELS = ["Cards", "Table", "JSON"];

/** Gray circular toolbar button with an accent glyph; tinted when its feature is active. */
const ToolbarButton = memo(function ToolbarButton({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  const tamagui = useTamaguiTheme();
  return (
    <Pressable
      hitSlop={4}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!active }}
    >
      {({ pressed }) => (
        <YStack
          width={36}
          height={36}
          borderRadius="$full"
          backgroundColor={active ? "$accentMuted" : "$fill"}
          alignItems="center"
          justifyContent="center"
          opacity={pressed ? 0.6 : 1}
        >
          <Ionicons name={icon} size={17} color={tamagui.accent.val} />
        </YStack>
      )}
    </Pressable>
  );
});

export const ResultsView = memo(function ResultsView({
  result,
  connectionId,
  query,
  onCopyAll,
}: ResultsViewProps) {
  const tamagui = useTamaguiTheme();
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
      setResultsViewMode(connectionId, next).catch(() => {});
    },
    [connectionId],
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
    const sorted = [...filteredRows].sort((a, b) => compareValues(a[sortColumn], b[sortColumn]));
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

  const rowCountLabel = `${result.rowCount.toLocaleString()} row${result.rowCount === 1 ? "" : "s"}`;
  const summary = search.trim()
    ? `${displayRows.length.toLocaleString()} of ${rowCountLabel} · ${result.executionTime} ms`
    : `${rowCountLabel} · ${result.executionTime} ms`;

  if (result.columns.length === 0) {
    return (
      <XStack
        alignItems="center"
        gap={12}
        minHeight={44}
        paddingHorizontal="$md"
        paddingVertical={11}
        backgroundColor="$surface"
        borderRadius="$md"
        style={{ borderCurve: "continuous" }}
      >
        <Ionicons name="checkmark-circle" size={22} color={tamagui.success.val} />
        <AppText variant="body" flex={1}>
          {result.rowCount > 0
            ? `${result.rowCount.toLocaleString()} Row${result.rowCount === 1 ? "" : "s"} Affected`
            : "Query Executed"}
        </AppText>
        <AppText variant="footnote" tone="secondary" fontVariant={["tabular-nums"]}>
          {result.executionTime} ms
        </AppText>
      </XStack>
    );
  }

  const customized = prefs.pinned.length + prefs.hidden.length > 0;

  return (
    <YStack flex={1} gap={12}>
      <XStack alignItems="center" justifyContent="space-between" gap="$sm">
        <XStack alignItems="center" gap={6} flex={1} minWidth={0}>
          <Ionicons name="checkmark-circle" size={16} color={tamagui.success.val} />
          <AppText
            variant="footnote"
            tone="secondary"
            numberOfLines={1}
            flexShrink={1}
            fontVariant={["tabular-nums"]}
          >
            {summary}
          </AppText>
        </XStack>
        {/* Mode switches are frequent and peer-level, so they don't animate. */}
        <Segmented
          values={MODE_LABELS}
          selectedIndex={Math.max(0, MODES.indexOf(mode))}
          onChange={(index) => {
            const next = MODES[index];
            if (next) handleModeChange(next);
          }}
          style={{ width: 186 }}
          accessibilityLabel="Results view"
        />
      </XStack>

      <XStack alignItems="center" gap="$sm">
        <SearchField value={search} onChangeText={setSearch} placeholder="Filter Rows" />
        <ToolbarButton
          icon="swap-vertical"
          label="Sort"
          active={!!sortColumn}
          onPress={() => setShowSort(true)}
        />
        <ToolbarButton
          icon="options-outline"
          label="Customize fields"
          active={customized}
          onPress={() => setShowCustomize(true)}
        />
        <ToolbarButton icon="copy-outline" label="Copy all rows" onPress={onCopyAll} />
      </XStack>

      <YStack flex={1}>
        {result.rows.length === 0 ? (
          <YStack flex={1} alignItems="center" justifyContent="center" paddingVertical="$xl">
            <EmptyState
              icon={<Ionicons name="leaf-outline" size={40} color={tamagui.textSubtle.val} />}
              title="No Rows Returned"
              message="The query ran fine. It just didn't match any rows."
            />
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
            ? String(detailRow[resolved.primary.name] ?? "Row Details")
            : "Row Details"
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
