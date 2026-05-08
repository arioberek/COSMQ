import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { memo, useCallback } from "react";
import { Pressable, ScrollView } from "react-native";
import { Sheet, Text, useTheme as useTamaguiTheme, XStack, YStack } from "tamagui";
import { useHaptic } from "../../lib/haptics";
import type { ColumnInfo } from "../../lib/types";
import { CellValue } from "./CellValue";
import { stringifyCell } from "./format";

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

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      animation="medium"
      zIndex={200000}
      dismissOnSnapToBottom
      snapPoints={[88, 60]}
    >
      <Sheet.Overlay
        animation="lazy"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
        backgroundColor="$dialogOverlay"
      />
      <Sheet.Frame
        backgroundColor="$surfaceElevated"
        borderTopLeftRadius={20}
        borderTopRightRadius={20}
        padding="$lg"
        gap="$md"
      >
        <Sheet.Handle backgroundColor="$dialogHandle" alignSelf="center" />
        <XStack alignItems="center" justifyContent="space-between">
          <Text fontSize={17} fontWeight="600" color="$color" letterSpacing={-0.2}>
            {title ?? "Row details"}
          </Text>
          <Pressable hitSlop={10} onPress={() => onOpenChange(false)}>
            <Ionicons name="close" size={22} color={tamagui.placeholderColor.val} />
          </Pressable>
        </XStack>

        <ScrollView showsVerticalScrollIndicator={false}>
          <YStack gap="$sm" paddingBottom={32}>
            {row === null ? (
              <Text color="$placeholderColor" fontSize={14}>
                No row selected.
              </Text>
            ) : (
              columns.map((col) => {
                const value = row[col.name];
                return (
                  <YStack
                    key={col.name}
                    gap={4}
                    paddingVertical="$sm"
                    paddingHorizontal="$sm"
                    backgroundColor="$surface"
                    borderRadius="$sm"
                    borderWidth={1}
                    borderColor="$borderColor"
                  >
                    <XStack alignItems="center" justifyContent="space-between" gap="$sm">
                      <YStack flex={1} gap={2}>
                        <Text
                          color="$placeholderColor"
                          fontSize={11}
                          fontFamily="$mono"
                          textTransform="uppercase"
                          letterSpacing={0.4}
                        >
                          {col.name}
                          {col.type ? `  ·  ${col.type.toLowerCase()}` : ""}
                        </Text>
                      </YStack>
                      <Pressable hitSlop={8} onPress={() => copyValue(value)}>
                        <Ionicons
                          name="copy-outline"
                          size={16}
                          color={tamagui.placeholderColor.val}
                        />
                      </Pressable>
                    </XStack>
                    <YStack>
                      {value !== null && value !== undefined && typeof value === "object" ? (
                        <Text color="$color" fontSize={12} fontFamily="$mono" selectable>
                          {stringifyCell(value)}
                        </Text>
                      ) : (
                        <CellValue column={col} value={value} numberOfLines={6} />
                      )}
                    </YStack>
                  </YStack>
                );
              })
            )}
          </YStack>
        </ScrollView>
      </Sheet.Frame>
    </Sheet>
  );
});
