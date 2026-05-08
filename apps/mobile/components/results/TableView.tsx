import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  PanResponder,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { Text, useTheme as useTamaguiTheme, XStack, YStack } from "tamagui";
import { useHaptic } from "../../lib/haptics";
import type { ColumnInfo } from "../../lib/types";
import type { ResolvedColumns } from "./columnPriority";
import { previewString, stringifyCell } from "./format";

type SortDir = "asc" | "desc" | null;

type TableViewProps = {
  rows: Record<string, unknown>[];
  resolved: ResolvedColumns;
  sortColumn: string | null;
  sortDir: SortDir;
  onSortChange: (column: string, dir: SortDir) => void;
};

const COL_CHAR_PX = 8.2;
const COL_PAD = 28;
const COL_MIN = 80;
const COL_MAX = 240;
const PK_WIDTH = 132;

const computeColumnWidth = (col: ColumnInfo, rows: Record<string, unknown>[]): number => {
  const headerPx = Math.max(col.name.length, (col.type ?? "").length) * COL_CHAR_PX + COL_PAD;
  const maxContent = rows.slice(0, 40).reduce((mx, row) => {
    const v = row[col.name];
    const s = v === null || v === undefined
      ? ""
      : typeof v === "object"
        ? JSON.stringify(v)
        : String(v);
    return Math.max(mx, Math.min(s.length, 36));
  }, 0);
  const contentPx = maxContent * COL_CHAR_PX + COL_PAD;
  return Math.min(Math.max(Math.max(headerPx, contentPx), COL_MIN), COL_MAX);
};

const SortIndicator = ({ dir }: { dir: SortDir }) => {
  const tamagui = useTamaguiTheme();
  const muted = tamagui.placeholderColor.val;
  const active = tamagui.primary.val;
  return (
    <YStack alignItems="center" justifyContent="center">
      <Ionicons name="caret-up" size={9} color={dir === "asc" ? active : muted} />
      <YStack marginTop={-2}>
        <Ionicons name="caret-down" size={9} color={dir === "desc" ? active : muted} />
      </YStack>
    </YStack>
  );
};

const ResizeHandle = ({
  onChange,
  onCommit,
}: {
  onChange: (delta: number) => void;
  onCommit: () => void;
}) => {
  const startedRef = useRef(0);
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          startedRef.current = 0;
        },
        onPanResponderMove: (_, gs) => {
          onChange(gs.dx - startedRef.current);
          startedRef.current = gs.dx;
        },
        onPanResponderRelease: () => {
          onCommit();
        },
        onPanResponderTerminate: () => {
          onCommit();
        },
      }),
    [onChange, onCommit],
  );
  return (
    <View
      {...responder.panHandlers}
      style={{
        position: "absolute",
        right: 0,
        top: 0,
        bottom: 0,
        width: 18,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: 3,
          height: 22,
          borderRadius: 2,
          backgroundColor: "rgba(124,92,255,0.85)",
        }}
      />
    </View>
  );
};

const HeaderCell = memo(function HeaderCell({
  column,
  width,
  isSorted,
  sortDir,
  onPress,
  onLongPress,
  resizing,
  onResizeChange,
  onResizeCommit,
}: {
  column: ColumnInfo;
  width: number;
  isSorted: boolean;
  sortDir: SortDir;
  onPress: () => void;
  onLongPress: () => void;
  resizing: boolean;
  onResizeChange: (delta: number) => void;
  onResizeCommit: () => void;
}) {
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} delayLongPress={350}>
      <XStack
        width={width}
        paddingHorizontal="$sm"
        paddingVertical={9}
        alignItems="center"
        gap={6}
        backgroundColor={resizing ? "$primaryMuted" : "$surfaceAlt"}
        borderRightWidth={1}
        borderRightColor="$borderColor"
      >
        <YStack flex={1} gap={2}>
          <Text
            color="$color"
            fontSize={12}
            fontWeight="600"
            fontFamily="$mono"
            numberOfLines={1}
          >
            {column.name}
          </Text>
          {column.type ? (
            <Text color="$placeholderColor" fontSize={10} fontFamily="$mono" numberOfLines={1}>
              {column.type.toLowerCase()}
            </Text>
          ) : null}
        </YStack>
        <SortIndicator dir={isSorted ? sortDir : null} />
        {resizing ? (
          <ResizeHandle onChange={onResizeChange} onCommit={onResizeCommit} />
        ) : null}
      </XStack>
    </Pressable>
  );
});

const DataCell = memo(function DataCell({
  column,
  value,
  width,
  alt,
  onCopy,
}: {
  column: ColumnInfo;
  value: unknown;
  width: number;
  alt: boolean;
  onCopy: (v: unknown) => void;
}) {
  return (
    <Pressable onPress={() => onCopy(value)}>
      <XStack
        width={width}
        paddingHorizontal="$sm"
        paddingVertical={10}
        backgroundColor={alt ? "$surfaceAlt" : "$surface"}
        borderRightWidth={1}
        borderRightColor="$borderColor"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
        alignItems="flex-start"
      >
        {value === null || value === undefined ? (
          <Text color="$placeholderColor" fontSize={12} fontFamily="$mono" fontStyle="italic">
            null
          </Text>
        ) : (
          <Text color="$textMuted" fontSize={13} fontFamily="$mono" numberOfLines={3}>
            {typeof value === "object"
              ? previewString(stringifyCell(value), 200)
              : previewString(String(value), 200)}
          </Text>
        )}
      </XStack>
    </Pressable>
  );
});

export const TableView = memo(function TableView({
  rows,
  resolved,
  sortColumn,
  sortDir,
  onSortChange,
}: TableViewProps) {
  const haptic = useHaptic();
  const [widthOverrides, setWidthOverrides] = useState<Record<string, number>>({});
  const [resizingCol, setResizingCol] = useState<string | null>(null);

  const stickyCol = resolved.primary;
  const dataCols = useMemo(
    () => resolved.visible.filter((c) => c.name !== stickyCol?.name),
    [resolved.visible, stickyCol],
  );

  const widths = useMemo(() => {
    const map: Record<string, number> = {};
    for (const col of dataCols) {
      map[col.name] = widthOverrides[col.name] ?? computeColumnWidth(col, rows);
    }
    return map;
  }, [dataCols, rows, widthOverrides]);

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

  const verticalScrollRef = useRef<ScrollView>(null);
  const stickyScrollRef = useRef<ScrollView>(null);
  const lastSyncedRef = useRef(0);

  const onMainScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    if (Math.abs(y - lastSyncedRef.current) < 0.5) return;
    lastSyncedRef.current = y;
    stickyScrollRef.current?.scrollTo({ y, animated: false });
  }, []);

  const renderHeader = (col: ColumnInfo, width: number, isSticky: boolean) => (
    <HeaderCell
      key={`h-${col.name}`}
      column={col}
      width={width}
      isSorted={sortColumn === col.name}
      sortDir={sortDir}
      onPress={() => handleHeaderTap(col.name)}
      onLongPress={isSticky ? () => {} : () => onLongPressHeader(col.name)}
      resizing={resizingCol === col.name}
      onResizeChange={(d) => handleResizeChange(col.name, d)}
      onResizeCommit={handleResizeCommit}
    />
  );

  if (rows.length === 0) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$lg" gap="$sm">
        <Ionicons name="grid-outline" size={28} color="#8a8aa0" />
        <Text color="$placeholderColor" fontSize={14}>
          No rows match the current view.
        </Text>
      </YStack>
    );
  }

  return (
    <YStack
      flex={1}
      borderRadius="$md"
      borderWidth={1}
      borderColor="$borderColor"
      overflow="hidden"
      style={{ borderCurve: "continuous" }}
    >
      <View style={{ flex: 1, position: "relative" }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={{ minWidth: totalDataWidth + (stickyCol ? PK_WIDTH : 0) }}
        >
          <ScrollView
            ref={verticalScrollRef}
            scrollEventThrottle={16}
            onScroll={onMainScroll}
            showsVerticalScrollIndicator={false}
            stickyHeaderIndices={[0]}
            nestedScrollEnabled
          >
            <XStack backgroundColor="$surfaceAlt">
              {stickyCol ? <YStack width={PK_WIDTH} /> : null}
              {dataCols.map((col) => renderHeader(col, widths[col.name] ?? COL_MIN, false))}
            </XStack>
            {rows.map((row, ri) => (
              <XStack key={`r-${ri}`}>
                {stickyCol ? <YStack width={PK_WIDTH} /> : null}
                {dataCols.map((col) => (
                  <DataCell
                    key={`c-${col.name}-${ri}`}
                    column={col}
                    value={row[col.name]}
                    width={widths[col.name] ?? COL_MIN}
                    alt={ri % 2 === 1}
                    onCopy={copyCell}
                  />
                ))}
              </XStack>
            ))}
          </ScrollView>
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
            <ScrollView
              ref={stickyScrollRef}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
              stickyHeaderIndices={[0]}
            >
              <XStack backgroundColor="$surfaceAlt">
                {renderHeader(stickyCol, PK_WIDTH, true)}
              </XStack>
              {rows.map((row, ri) => (
                <DataCell
                  key={`sticky-${ri}`}
                  column={stickyCol}
                  value={row[stickyCol.name]}
                  width={PK_WIDTH}
                  alt={ri % 2 === 1}
                  onCopy={copyCell}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}
      </View>
    </YStack>
  );
});
