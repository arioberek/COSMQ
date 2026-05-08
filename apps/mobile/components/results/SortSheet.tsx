import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { Pressable, ScrollView } from "react-native";
import { Sheet, Text, useTheme as useTamaguiTheme, XStack, YStack } from "tamagui";
import type { ColumnInfo } from "../../lib/types";

export type SortDir = "asc" | "desc" | null;

type SortSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: ColumnInfo[];
  sortColumn: string | null;
  sortDir: SortDir;
  onSelect: (column: string, dir: SortDir) => void;
  onClear: () => void;
};

export const SortSheet = memo(function SortSheet({
  open,
  onOpenChange,
  columns,
  sortColumn,
  sortDir,
  onSelect,
  onClear,
}: SortSheetProps) {
  const tamagui = useTamaguiTheme();

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      animation="medium"
      zIndex={200000}
      dismissOnSnapToBottom
      snapPoints={[70]}
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
            Sort by
          </Text>
          <Pressable hitSlop={10} onPress={onClear}>
            <Text color="$primary" fontSize={13} fontWeight="600">
              Clear
            </Text>
          </Pressable>
        </XStack>

        <ScrollView showsVerticalScrollIndicator={false}>
          <YStack gap={6} paddingBottom={32}>
            {columns.map((col) => {
              const isSorted = sortColumn === col.name;
              return (
                <XStack
                  key={col.name}
                  alignItems="center"
                  justifyContent="space-between"
                  paddingHorizontal="$sm"
                  paddingVertical="$sm"
                  backgroundColor="$surface"
                  borderRadius="$sm"
                  borderWidth={1}
                  borderColor={isSorted ? "$primary" : "$borderColor"}
                  gap="$sm"
                >
                  <YStack flex={1}>
                    <Text color="$color" fontSize={14} fontWeight="500" numberOfLines={1}>
                      {col.name}
                    </Text>
                  </YStack>
                  <XStack gap={6}>
                    <Pressable
                      hitSlop={6}
                      onPress={() =>
                        onSelect(col.name, isSorted && sortDir === "asc" ? null : "asc")
                      }
                    >
                      <XStack
                        width={64}
                        height={32}
                        borderRadius={8}
                        backgroundColor={
                          isSorted && sortDir === "asc" ? "$primaryMuted" : "$surfaceMuted"
                        }
                        alignItems="center"
                        justifyContent="center"
                        gap={4}
                      >
                        <Ionicons
                          name="arrow-up"
                          size={12}
                          color={
                            isSorted && sortDir === "asc"
                              ? tamagui.primary.val
                              : tamagui.placeholderColor.val
                          }
                        />
                        <Text
                          color={isSorted && sortDir === "asc" ? "$primary" : "$placeholderColor"}
                          fontSize={11}
                          fontWeight="600"
                        >
                          ASC
                        </Text>
                      </XStack>
                    </Pressable>
                    <Pressable
                      hitSlop={6}
                      onPress={() =>
                        onSelect(col.name, isSorted && sortDir === "desc" ? null : "desc")
                      }
                    >
                      <XStack
                        width={64}
                        height={32}
                        borderRadius={8}
                        backgroundColor={
                          isSorted && sortDir === "desc" ? "$primaryMuted" : "$surfaceMuted"
                        }
                        alignItems="center"
                        justifyContent="center"
                        gap={4}
                      >
                        <Ionicons
                          name="arrow-down"
                          size={12}
                          color={
                            isSorted && sortDir === "desc"
                              ? tamagui.primary.val
                              : tamagui.placeholderColor.val
                          }
                        />
                        <Text
                          color={isSorted && sortDir === "desc" ? "$primary" : "$placeholderColor"}
                          fontSize={11}
                          fontWeight="600"
                        >
                          DESC
                        </Text>
                      </XStack>
                    </Pressable>
                  </XStack>
                </XStack>
              );
            })}
          </YStack>
        </ScrollView>
      </Sheet.Frame>
    </Sheet>
  );
});
