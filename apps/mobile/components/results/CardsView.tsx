import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { memo, useCallback, useMemo, useState } from "react";
import { FlatList, Pressable } from "react-native";
import { Text, useTheme as useTamaguiTheme, XStack, YStack } from "tamagui";
import { useHaptic } from "../../lib/haptics";
import type { ColumnInfo } from "../../lib/types";
import { CellValue } from "./CellValue";
import { type ResolvedColumns } from "./columnPriority";
import { previewString, stringifyCell } from "./format";

type CardsViewProps = {
  rows: Record<string, unknown>[];
  resolved: ResolvedColumns;
  onOpenDetail: (row: Record<string, unknown>) => void;
};

type RowItem = { row: Record<string, unknown>; index: number };

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
    <XStack alignItems="flex-start" justifyContent="space-between" gap="$sm">
      <Text
        color="$placeholderColor"
        fontSize={11}
        fontFamily="$mono"
        textTransform="uppercase"
        letterSpacing={0.4}
        flexShrink={0}
        maxWidth="40%"
        numberOfLines={1}
      >
        {column.name}
      </Text>
      <YStack flex={1} alignItems="flex-end">
        <CellValue
          column={column}
          value={row[column.name]}
          numberOfLines={2}
          onJsonPress={() => onOpenDetail(row)}
        />
      </YStack>
    </XStack>
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

  return (
    <YStack
      backgroundColor="$surface"
      borderWidth={1}
      borderColor="$borderColor"
      borderRadius="$md"
      padding="$md"
      gap="$sm"
      style={{ borderCurve: "continuous" }}
    >
      <XStack alignItems="center" justifyContent="space-between" gap="$sm">
        <XStack
          backgroundColor="$primaryMuted"
          borderRadius={999}
          paddingHorizontal={10}
          paddingVertical={4}
          maxWidth="65%"
        >
          <Text
            color="$primary"
            fontSize={12}
            fontWeight="600"
            fontFamily="$mono"
            numberOfLines={1}
          >
            {title}
          </Text>
        </XStack>
        <XStack gap={6}>
          <Pressable hitSlop={8} onPress={handleCopy}>
            <YStack
              width={32}
              height={32}
              borderRadius={16}
              backgroundColor="$surfaceMuted"
              alignItems="center"
              justifyContent="center"
            >
              <Ionicons name="copy-outline" size={15} color={tamagui.placeholderColor.val} />
            </YStack>
          </Pressable>
          <Pressable hitSlop={8} onPress={() => onOpenDetail(row)}>
            <YStack
              width={32}
              height={32}
              borderRadius={16}
              backgroundColor="$surfaceMuted"
              alignItems="center"
              justifyContent="center"
            >
              <Ionicons name="expand-outline" size={15} color={tamagui.placeholderColor.val} />
            </YStack>
          </Pressable>
        </XStack>
      </XStack>

      <Pressable onPress={() => onOpenDetail(row)}>
        <YStack gap="$sm" paddingTop={4}>
          {resolved.preview.length === 0 ? (
            <Text color="$placeholderColor" fontSize={12}>
              No additional fields.
            </Text>
          ) : (
            resolved.preview.map((col) => (
              <FieldRow key={col.name} column={col} row={row} onOpenDetail={onOpenDetail} />
            ))
          )}
        </YStack>
      </Pressable>

      {restCount > 0 ? (
        <>
          {expanded ? (
            <YStack gap="$sm" paddingTop={4}>
              {resolved.rest.map((col) => (
                <FieldRow key={col.name} column={col} row={row} onOpenDetail={onOpenDetail} />
              ))}
            </YStack>
          ) : null}
          <Pressable
            onPress={() => {
              setExpanded((v) => !v);
              haptic.light();
            }}
          >
            <XStack alignItems="center" gap={4} paddingTop={4}>
              <Text color="$primary" fontSize={12} fontWeight="600">
                {expanded ? "View less" : `View more (${restCount})`}
              </Text>
              <Ionicons
                name={expanded ? "chevron-up" : "chevron-down"}
                size={14}
                color={tamagui.primary.val}
              />
            </XStack>
          </Pressable>
        </>
      ) : null}
    </YStack>
  );
});

export const CardsView = memo(function CardsView({
  rows,
  resolved,
  onOpenDetail,
}: CardsViewProps) {
  const data = useMemo(
    () => rows.map((row, index): RowItem => ({ row, index })),
    [rows],
  );

  if (rows.length === 0) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$lg" gap="$sm">
        <Ionicons name="albums-outline" size={28} color="#8a8aa0" />
        <Text color="$placeholderColor" fontSize={14}>
          No rows match the current view.
        </Text>
      </YStack>
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => `row-${item.index}`}
      contentContainerStyle={{ gap: 10, paddingBottom: 24 }}
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
