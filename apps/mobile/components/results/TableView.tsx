import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useTheme as useTamaguiTheme, XStack, YStack } from "tamagui";
import { useHaptic } from "../../lib/haptics";
import type { ColumnInfo } from "../../lib/types";
import { EmptyState } from "../ui/EmptyState";
import { AppText } from "../ui/Text";
import { NullValue } from "./CellValue";
import type { ResolvedColumns } from "./columnPriority";
import { isNullish, isNumericType, previewString, stringifyCell } from "./format";

type SortDir = "asc" | "desc" | null;

type TableViewProps = {
  rows: Record<string, unknown>[];
  resolved: ResolvedColumns;
  sortColumn: string | null;
  sortDir: SortDir;
  onSortChange: (column: string, dir: SortDir) => void;
};

const COL_CHAR_PX = 8;
const COL_PAD = 24;
const COL_MIN = 80;
const COL_MAX = 240;
const PK_WIDTH = 132;
// Fixed heights keep the overlaid sticky column aligned with the main grid.
const HEADER_HEIGHT = 44;
const ROW_HEIGHT = 36;
const CELL_PAD_X = 10;

const computeColumnWidth = (col: ColumnInfo, rows: Record<string, unknown>[]): number => {
  const headerPx = Math.max(col.name.length, (col.type ?? "").length) * 7 + COL_PAD + 14;
  const maxContent = rows.slice(0, 40).reduce((mx, row) => {
    const v = row[col.name];
    const s =
      v === null || v === undefined
        ? "NULL"
        : typeof v === "object"
          ? JSON.stringify(v)
          : String(v);
    return Math.max(mx, Math.min(s.length, 36));
  }, 0);
  const contentPx = maxContent * COL_CHAR_PX + COL_PAD;
  return Math.min(Math.max(Math.max(headerPx, contentPx), COL_MIN), COL_MAX);
};

/** A column is numeric when its declared type is, or its first non-null sample is a number. */
const isNumericColumn = (col: ColumnInfo, rows: Record<string, unknown>[]): boolean => {
  if (isNumericType(col.type)) return true;
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const v = rows[i][col.name];
    if (!isNullish(v)) return typeof v === "number";
  }
  return false;
};

const ResizeHandle = ({
  onChange,
  onCommit,
}: {
  onChange: (delta: number) => void;
  onCommit: () => void;
}) => {
  const tamagui = useTamaguiTheme();
  // Callbacks live in refs so the gesture object stays stable for the whole
  // drag; recreating it mid-gesture would re-register the handler.
  const onChangeRef = useRef(onChange);
  const onCommitRef = useRef(onCommit);
  onChangeRef.current = onChange;
  onCommitRef.current = onCommit;
  const lastRef = useRef(0);

  // Width is a layout property every cell in the column depends on, so the
  // drag has to go through React state; runOnJS keeps the callbacks on the JS
  // thread (this is a rare, deliberate edit, not a per-frame animation).
  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .minDistance(0)
        .onBegin(() => {
          lastRef.current = 0;
        })
        .onUpdate((e) => {
          onChangeRef.current(e.translationX - lastRef.current);
          lastRef.current = e.translationX;
        })
        .onFinalize(() => {
          onCommitRef.current();
        }),
    [],
  );

  return (
    <GestureDetector gesture={gesture}>
      <View
        accessibilityLabel="Drag to resize column"
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: 22,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: 4,
            height: 22,
            borderRadius: 2,
            backgroundColor: tamagui.accent.val,
          }}
        />
      </View>
    </GestureDetector>
  );
};

const HeaderCell = memo(function HeaderCell({
  column,
  width,
  numeric,
  isSorted,
  sortDir,
  onPress,
  onLongPress,
  resizing,
  isSticky,
  onResizeChange,
  onResizeCommit,
}: {
  column: ColumnInfo;
  width: number;
  numeric: boolean;
  isSorted: boolean;
  sortDir: SortDir;
  onPress: () => void;
  onLongPress: () => void;
  resizing: boolean;
  isSticky: boolean;
  onResizeChange: (delta: number) => void;
  onResizeCommit: () => void;
}) {
  const tamagui = useTamaguiTheme();
  const sorted = isSorted && sortDir !== null;
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      accessibilityRole="button"
      accessibilityLabel={`${column.name}${sorted ? `, sorted ${sortDir === "asc" ? "ascending" : "descending"}` : ""}`}
      accessibilityHint="Tap to sort. Long-press to resize."
    >
      {({ pressed }) => (
        <XStack
          width={width}
          height={HEADER_HEIGHT}
          paddingHorizontal={CELL_PAD_X}
          alignItems="center"
          gap={4}
          backgroundColor={resizing ? "$accentMuted" : pressed ? "$surfaceMuted" : "$surfaceAlt"}
          borderRightWidth={0.5}
          borderRightColor={isSticky ? "$borderColor" : "$borderSubtle"}
          borderBottomWidth={0.5}
          borderBottomColor="$borderColor"
        >
          <YStack flex={1} minWidth={0} alignItems={numeric ? "flex-end" : "flex-start"}>
            <AppText
              variant="caption2"
              tone={sorted ? "accent" : "secondary"}
              emphasized
              textTransform="uppercase"
              numberOfLines={1}
            >
              {column.name}
            </AppText>
            {column.type ? (
              <AppText variant="caption2" tone="tertiary" numberOfLines={1}>
                {column.type.toLowerCase()}
              </AppText>
            ) : null}
          </YStack>
          {sorted ? (
            <Ionicons
              name={sortDir === "asc" ? "chevron-up" : "chevron-down"}
              size={12}
              color={tamagui.accent.val}
            />
          ) : null}
          {resizing ? <ResizeHandle onChange={onResizeChange} onCommit={onResizeCommit} /> : null}
        </XStack>
      )}
    </Pressable>
  );
});

const DataCell = memo(function DataCell({
  value,
  width,
  numeric,
  isSticky,
  onCopy,
}: {
  value: unknown;
  width: number;
  numeric: boolean;
  isSticky?: boolean;
  onCopy: (v: unknown) => void;
}) {
  const text = isNullish(value)
    ? null
    : typeof value === "object"
      ? previewString(stringifyCell(value), 200)
      : previewString(String(value), 200);
  return (
    <Pressable
      onPress={() => onCopy(value)}
      accessibilityRole="button"
      accessibilityLabel={text ?? "NULL"}
      accessibilityHint="Copies the value"
    >
      {({ pressed }) => (
        <XStack
          width={width}
          height={ROW_HEIGHT}
          paddingHorizontal={CELL_PAD_X}
          alignItems="center"
          justifyContent={numeric ? "flex-end" : "flex-start"}
          backgroundColor={pressed ? "$surfaceMuted" : "$surface"}
          borderRightWidth={0.5}
          borderRightColor={isSticky ? "$borderColor" : "$borderSubtle"}
          borderBottomWidth={0.5}
          borderBottomColor="$borderSubtle"
        >
          {text === null ? (
            <NullValue />
          ) : (
            <AppText
              variant="code"
              numberOfLines={1}
              fontVariant={numeric ? ["tabular-nums"] : undefined}
            >
              {text}
            </AppText>
          )}
        </XStack>
      )}
    </Pressable>
  );
});

const DataRow = memo(function DataRow({
  row,
  stickyWidth,
  dataCols,
  widths,
  numericCols,
  onCopy,
}: {
  row: Record<string, unknown>;
  stickyWidth: number;
  dataCols: ColumnInfo[];
  widths: Record<string, number>;
  numericCols: Set<string>;
  onCopy: (v: unknown) => void;
}) {
  return (
    <XStack>
      {stickyWidth > 0 ? <YStack width={stickyWidth} /> : null}
      {dataCols.map((col) => (
        <DataCell
          key={`c-${col.name}`}
          value={row[col.name]}
          width={widths[col.name] ?? COL_MIN}
          numeric={numericCols.has(col.name)}
          onCopy={onCopy}
        />
      ))}
    </XStack>
  );
});

export const TableView = memo(function TableView({
  rows,
  resolved,
  sortColumn,
  sortDir,
  onSortChange,
}: TableViewProps) {
  const tamagui = useTamaguiTheme();
  const haptic = useHaptic();
  const [widthOverrides, setWidthOverrides] = useState<Record<string, number>>({});
  const [resizingCol, setResizingCol] = useState<string | null>(null);

  const stickyCol = resolved.primary;
  const dataCols = useMemo(
    () => resolved.visible.filter((c) => c.name !== stickyCol?.name),
    [resolved.visible, stickyCol],
  );

  // Reset user-resized widths when the column set changes — e.g. when the
  // user runs a new query whose columns happen to overlap with the previous
  // result. Without this, the prior widths leak across unrelated queries.
  const columnsSignature = useMemo(
    () => resolved.visible.map((c) => c.name).join("|"),
    [resolved.visible],
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies: the signature is the trigger
  useEffect(() => {
    setWidthOverrides({});
    setResizingCol(null);
  }, [columnsSignature]);

  const widths = useMemo(() => {
    const map: Record<string, number> = {};
    for (const col of dataCols) {
      map[col.name] = widthOverrides[col.name] ?? computeColumnWidth(col, rows);
    }
    return map;
  }, [dataCols, rows, widthOverrides]);

  const numericCols = useMemo(() => {
    const set = new Set<string>();
    for (const col of resolved.visible) if (isNumericColumn(col, rows)) set.add(col.name);
    return set;
  }, [resolved.visible, rows]);

  const totalDataWidth = useMemo(
    () => dataCols.reduce((sum, c) => sum + (widths[c.name] ?? COL_MIN), 0),
    [dataCols, widths],
  );

  const handleSortPress = useCallback(
    (col: string) => {
      if (sortColumn !== col) {
        onSortChange(col, "asc");
        return;
      }
      const next: SortDir = sortDir === "asc" ? "desc" : sortDir === "desc" ? null : "asc";
      onSortChange(col, next);
    },
    [sortColumn, sortDir, onSortChange],
  );

  const onLongPressHeader = useCallback(
    (col: string) => {
      haptic.medium();
      setResizingCol((cur) => (cur === col ? null : col));
    },
    [haptic],
  );

  const handleResizeChange = useCallback(
    (col: string, delta: number) => {
      setWidthOverrides((prev) => {
        const current = prev[col] ?? widths[col] ?? COL_MIN;
        const next = Math.max(COL_MIN, Math.min(COL_MAX * 1.5, current + delta));
        return { ...prev, [col]: next };
      });
    },
    [widths],
  );

  const handleResizeCommit = useCallback(() => {
    setResizingCol(null);
  }, []);

  const copyCell = useCallback(
    async (v: unknown) => {
      await Clipboard.setStringAsync(stringifyCell(v));
      haptic.light();
    },
    [haptic],
  );

  const handleHeaderTap = useCallback(
    (col: string) => {
      if (resizingCol) {
        setResizingCol(null);
        return;
      }
      handleSortPress(col);
    },
    [resizingCol, handleSortPress],
  );

  const verticalScrollRef = useRef<FlatList<Record<string, unknown>>>(null);
  const stickyScrollRef = useRef<FlatList<Record<string, unknown>>>(null);
  const lastSyncedRef = useRef(0);

  const onMainScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    if (Math.abs(y - lastSyncedRef.current) < 0.5) return;
    lastSyncedRef.current = y;
    stickyScrollRef.current?.scrollToOffset({ offset: y, animated: false });
  }, []);

  const renderHeader = (col: ColumnInfo, width: number, isSticky: boolean) => (
    <HeaderCell
      key={`h-${col.name}`}
      column={col}
      width={width}
      numeric={numericCols.has(col.name)}
      isSorted={sortColumn === col.name}
      sortDir={sortDir}
      onPress={() => handleHeaderTap(col.name)}
      onLongPress={isSticky ? () => {} : () => onLongPressHeader(col.name)}
      resizing={resizingCol === col.name}
      isSticky={isSticky}
      onResizeChange={(d) => handleResizeChange(col.name, d)}
      onResizeCommit={handleResizeCommit}
    />
  );

  if (rows.length === 0) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" paddingVertical="$xl">
        <EmptyState
          icon={<Ionicons name="grid-outline" size={40} color={tamagui.textSubtle.val} />}
          title="No Matching Rows"
          message="No rows match the current filter."
        />
      </YStack>
    );
  }

  return (
    <YStack
      flex={1}
      backgroundColor="$surface"
      borderRadius="$md"
      overflow="hidden"
      style={{ borderCurve: "continuous" }}
    >
      <View style={{ flex: 1, position: "relative" }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          bounces={false}
          // A resize drag must not also scroll the grid sideways.
          scrollEnabled={resizingCol === null}
          contentContainerStyle={{ minWidth: totalDataWidth + (stickyCol ? PK_WIDTH : 0) }}
        >
          <FlatList
            ref={verticalScrollRef}
            data={rows}
            keyExtractor={(_, i) => `r-${i}`}
            scrollEventThrottle={16}
            onScroll={onMainScroll}
            showsVerticalScrollIndicator={false}
            stickyHeaderIndices={[0]}
            nestedScrollEnabled
            removeClippedSubviews
            initialNumToRender={24}
            windowSize={9}
            maxToRenderPerBatch={20}
            ListHeaderComponent={
              <XStack backgroundColor="$surfaceAlt">
                {stickyCol ? <YStack width={PK_WIDTH} /> : null}
                {dataCols.map((col) => renderHeader(col, widths[col.name] ?? COL_MIN, false))}
              </XStack>
            }
            renderItem={({ item }) => (
              <DataRow
                row={item}
                stickyWidth={stickyCol ? PK_WIDTH : 0}
                dataCols={dataCols}
                widths={widths}
                numericCols={numericCols}
                onCopy={copyCell}
              />
            )}
          />
        </ScrollView>

        {stickyCol ? (
          <View
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: PK_WIDTH,
            }}
            pointerEvents="box-none"
          >
            <FlatList
              ref={stickyScrollRef}
              data={rows}
              keyExtractor={(_, i) => `sticky-${i}`}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
              stickyHeaderIndices={[0]}
              removeClippedSubviews
              initialNumToRender={24}
              windowSize={9}
              maxToRenderPerBatch={20}
              ListHeaderComponent={
                <XStack backgroundColor="$surfaceAlt">
                  {renderHeader(stickyCol, PK_WIDTH, true)}
                </XStack>
              }
              renderItem={({ item }) => (
                <DataCell
                  value={item[stickyCol.name]}
                  width={PK_WIDTH}
                  numeric={numericCols.has(stickyCol.name)}
                  isSticky
                  onCopy={copyCell}
                />
              )}
            />
          </View>
        ) : null}
      </View>
    </YStack>
  );
});
