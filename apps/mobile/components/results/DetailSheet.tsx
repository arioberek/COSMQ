import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { memo, useCallback } from "react";
import { Pressable } from "react-native";
import { useTheme as useTamaguiTheme, XStack, YStack } from "tamagui";
import { useHaptic } from "../../lib/haptics";
import type { ColumnInfo } from "../../lib/types";
import { ModalSheet } from "../ui/Dialog";
import { ListRow, ListSection } from "../ui/List";
import { AppText } from "../ui/Text";
import { CellValue, NullValue } from "./CellValue";
import { isNullish, stringifyCell } from "./format";

type DetailSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: ColumnInfo[];
  row: Record<string, unknown> | null;
  title?: string;
};

export const DetailSheet = memo(function DetailSheet({
  open,
  onOpenChange,
  columns,
  row,
  title,
}: DetailSheetProps) {
  const tamagui = useTamaguiTheme();
  const haptic = useHaptic();

  const copyValue = useCallback(
    async (value: unknown) => {
      await Clipboard.setStringAsync(stringifyCell(value));
      haptic.light();
    },
    [haptic],
  );

  const copyRow = useCallback(async () => {
    if (!row) return;
    const obj: Record<string, unknown> = {};
    for (const c of columns) obj[c.name] = row[c.name];
    await Clipboard.setStringAsync(stringifyCell(obj));
    haptic.light();
  }, [row, columns, haptic]);

  return (
    <ModalSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title ?? "Row Details"}
      subtitle={`${columns.length} field${columns.length === 1 ? "" : "s"}`}
      snapPoints={[88, 60]}
    >
      {row === null ? (
        <AppText variant="footnote" tone="secondary" style={{ textAlign: "center" }}>
          No row selected.
        </AppText>
      ) : (
        <>
          <ListSection>
            {columns.map((col, idx) => {
              const value = row[col.name];
              return (
                <ListRow
                  // biome-ignore lint/suspicious/noArrayIndexKey: unaliased joins can repeat column names
                  key={`${col.name}-${idx}`}
                  title={
                    <YStack gap={2}>
                      <XStack alignItems="baseline" gap={6}>
                        <AppText variant="footnote" tone="secondary" numberOfLines={1}>
                          {col.name}
                        </AppText>
                        {col.type ? (
                          <AppText variant="caption2" tone="tertiary" numberOfLines={1}>
                            {col.type.toLowerCase()}
                          </AppText>
                        ) : null}
                      </XStack>
                      {isNullish(value) ? (
                        <NullValue />
                      ) : typeof value === "object" ? (
                        <AppText variant="code" selectable>
                          {stringifyCell(value)}
                        </AppText>
                      ) : (
                        <CellValue column={col} value={value} numberOfLines={6} />
                      )}
                    </YStack>
                  }
                  accessory={
                    <Pressable
                      hitSlop={8}
                      onPress={() => copyValue(value)}
                      accessibilityRole="button"
                      accessibilityLabel={`Copy ${col.name}`}
                      style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
                    >
                      <Ionicons name="copy-outline" size={18} color={tamagui.accent.val} />
                    </Pressable>
                  }
                />
              );
            })}
          </ListSection>
          <ListSection>
            <ListRow title="Copy Row as JSON" tint onPress={copyRow} />
          </ListSection>
        </>
      )}
    </ModalSheet>
  );
});
