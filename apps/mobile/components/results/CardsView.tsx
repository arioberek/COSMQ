import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { memo, useCallback, useMemo, useState } from "react";
import { FlatList, Pressable } from "react-native";
import { useTheme as useTamaguiTheme, XStack, YStack } from "tamagui";
import { useHaptic } from "../../lib/haptics";
import type { ColumnInfo } from "../../lib/types";
import { EmptyState } from "../ui/EmptyState";
import { AppText } from "../ui/Text";
import { CellValue } from "./CellValue";
import type { ResolvedColumns } from "./columnPriority";
import { previewString, stringifyCell } from "./format";

type CardsViewProps = {
  rows: Record<string, unknown>[];
  resolved: ResolvedColumns;
  onOpenDetail: (row: Record<string, unknown>) => void;
};

type RowItem = { row: Record<string, unknown>; index: number; key: string };

const stableRowKey = (
  row: Record<string, unknown>,
  primary: ColumnInfo | null,
  index: number,
): string => {
  if (primary) {
    const v = row[primary.name];
    if (v !== null && v !== undefined && v !== "") {
      // Suffix the index so two rows with the same PK value (rare but
      // possible from joins or hand-crafted SELECTs) don't collide as
      // React keys.
      return `pk:${String(v)}-${index}`;
    }
  }
  // Fall back to index only when the result has no detectable PK. CardItem
  // expanded state will follow the position in that case, but there's no
  // stabler identity available.
  return `idx:${index}`;
};

const titleFromRow = (
  row: Record<string, unknown>,
  primary: ColumnInfo | null,
  fallback: ColumnInfo | undefined,
  index: number,
): string => {
  const pkVal = primary ? row[primary.name] : undefined;
  if (pkVal !== null && pkVal !== undefined && pkVal !== "") {
    return previewString(pkVal, 24);
  }
  if (fallback) {
    const v = row[fallback.name];
    if (v !== null && v !== undefined && v !== "") return previewString(v, 24);
  }
  return `Row ${index + 1}`;
};

/** Inset hairline between rows of a section, aligned with the row text. */
const Separator = () => <YStack height={0.5} marginLeft="$md" backgroundColor="$borderColor" />;

const FieldRow = memo(function FieldRow({
  column,
  row,
  onOpenDetail,
}: {
  column: ColumnInfo;
  row: Record<string, unknown>;
  onOpenDetail: (row: Record<string, unknown>) => void;
}) {
  return (
    <Pressable onPress={() => onOpenDetail(row)} accessibilityRole="button">
      {({ pressed }) => (
        <XStack
          alignItems="flex-start"
          justifyContent="space-between"
          gap="$md"
          paddingHorizontal="$md"
          paddingVertical={11}
          minHeight={44}
          backgroundColor={pressed ? "$surfaceMuted" : "transparent"}
        >
          <AppText
            variant="footnote"
            tone="secondary"
            flexShrink={0}
            maxWidth="40%"
            numberOfLines={1}
            paddingTop={1}
          >
            {column.name}
          </AppText>
          <YStack flex={1} minWidth={0} alignItems="flex-end">
            <CellValue
              column={column}
              value={row[column.name]}
              numberOfLines={2}
              textAlign="right"
              onJsonPress={() => onOpenDetail(row)}
            />
          </YStack>
        </XStack>
      )}
    </Pressable>
  );
});

const CardItem = memo(function CardItem({
  item,
  resolved,
  onOpenDetail,
}: {
  item: RowItem;
  resolved: ResolvedColumns;
  onOpenDetail: (row: Record<string, unknown>) => void;
}) {
  const tamagui = useTamaguiTheme();
  const haptic = useHaptic();
  const [expanded, setExpanded] = useState(false);
  const { row, index } = item;
  const title = titleFromRow(row, resolved.primary, resolved.preview[0], index);
  const restCount = resolved.rest.length;

  const handleCopy = useCallback(async () => {
    const obj: Record<string, unknown> = {};
    for (const c of resolved.visible) obj[c.name] = row[c.name];
    await Clipboard.setStringAsync(stringifyCell(obj));
    haptic.light();
  }, [resolved.visible, row, haptic]);

  const fields = expanded ? [...resolved.preview, ...resolved.rest] : resolved.preview;

  return (
    <YStack
      backgroundColor="$surface"
      borderRadius="$md"
      overflow="hidden"
      style={{ borderCurve: "continuous" }}
    >
      <XStack alignItems="center" minHeight={44}>
        <Pressable
          style={{ flex: 1 }}
          onPress={() => onOpenDetail(row)}
          accessibilityRole="button"
          accessibilityLabel={`${title}, open row details`}
        >
          {({ pressed }) => (
            <XStack
              alignItems="center"
              gap="$sm"
              paddingLeft="$md"
              paddingVertical={11}
              backgroundColor={pressed ? "$surfaceMuted" : "transparent"}
            >
              {resolved.primary ? (
                <AppText variant="footnote" tone="secondary" numberOfLines={1}>
                  {resolved.primary.name}
                </AppText>
              ) : null}
              <AppText variant="headline" numberOfLines={1} flexShrink={1}>
                {title}
              </AppText>
            </XStack>
          )}
        </Pressable>
        <Pressable
          hitSlop={6}
          onPress={handleCopy}
          accessibilityRole="button"
          accessibilityLabel="Copy row as JSON"
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.5 : 1,
          })}
        >
          <Ionicons name="copy-outline" size={18} color={tamagui.accent.val} />
        </Pressable>
      </XStack>

      {fields.length === 0 ? (
        <>
          <Separator />
          <YStack paddingHorizontal="$md" paddingVertical={11}>
            <AppText variant="footnote" tone="secondary">
              No additional fields.
            </AppText>
          </YStack>
        </>
      ) : (
        fields.map((col) => (
          <YStack key={col.name}>
            <Separator />
            <FieldRow column={col} row={row} onOpenDetail={onOpenDetail} />
          </YStack>
        ))
      )}

      {restCount > 0 ? (
        <>
          <Separator />
          <Pressable
            onPress={() => {
              setExpanded((v) => !v);
              haptic.light();
            }}
            accessibilityRole="button"
            accessibilityState={{ expanded }}
          >
            {({ pressed }) => (
              <XStack
                alignItems="center"
                gap={6}
                paddingHorizontal="$md"
                minHeight={44}
                backgroundColor={pressed ? "$surfaceMuted" : "transparent"}
              >
                <AppText variant="subhead" tone="accent" flex={1}>
                  {expanded
                    ? "Show Fewer Fields"
                    : `Show ${restCount} More Field${restCount === 1 ? "" : "s"}`}
                </AppText>
                <Ionicons
                  name={expanded ? "chevron-up" : "chevron-down"}
                  size={15}
                  color={tamagui.accent.val}
                />
              </XStack>
            )}
          </Pressable>
        </>
      ) : null}
    </YStack>
  );
});

export const CardsView = memo(function CardsView({ rows, resolved, onOpenDetail }: CardsViewProps) {
  const tamagui = useTamaguiTheme();
  const data = useMemo(
    () =>
      rows.map(
        (row, index): RowItem => ({
          row,
          index,
          key: stableRowKey(row, resolved.primary, index),
        }),
      ),
    [rows, resolved.primary],
  );

  if (rows.length === 0) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" paddingVertical="$xl">
        <EmptyState
          icon={<Ionicons name="albums-outline" size={40} color={tamagui.textSubtle.val} />}
          title="No Matching Rows"
          message="No rows match the current filter."
        />
      </YStack>
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.key}
      contentContainerStyle={{ gap: 16, paddingBottom: 24 }}
      renderItem={({ item }) => (
        <CardItem item={item} resolved={resolved} onOpenDetail={onOpenDetail} />
      )}
      removeClippedSubviews
      initialNumToRender={12}
      windowSize={9}
      maxToRenderPerBatch={10}
      showsVerticalScrollIndicator={false}
    />
  );
});
