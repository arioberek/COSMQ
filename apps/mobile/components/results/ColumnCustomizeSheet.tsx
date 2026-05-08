import { Ionicons } from "@expo/vector-icons";
import { memo, useCallback } from "react";
import { Pressable, ScrollView } from "react-native";
import { Sheet, Text, useTheme as useTamaguiTheme, XStack, YStack } from "tamagui";
import { useHaptic } from "../../lib/haptics";
import type { ColumnPrefs } from "../../lib/storage/results-prefs";
import type { ColumnInfo } from "../../lib/types";

type ColumnCustomizeSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: ColumnInfo[];
  prefs: ColumnPrefs;
  onChange: (prefs: ColumnPrefs) => void;
  onReset: () => void;
};

const togglePin = (prefs: ColumnPrefs, name: string): ColumnPrefs => {
  const isPinned = prefs.pinned.includes(name);
  return {
    pinned: isPinned ? prefs.pinned.filter((n) => n !== name) : [...prefs.pinned, name],
    hidden: prefs.hidden.filter((n) => n !== name),
  };
};

const toggleHide = (prefs: ColumnPrefs, name: string): ColumnPrefs => {
  const isHidden = prefs.hidden.includes(name);
  return {
    pinned: prefs.pinned.filter((n) => n !== name),
    hidden: isHidden ? prefs.hidden.filter((n) => n !== name) : [...prefs.hidden, name],
  };
};

export const ColumnCustomizeSheet = memo(function ColumnCustomizeSheet({
  open,
  onOpenChange,
  columns,
  prefs,
  onChange,
  onReset,
}: ColumnCustomizeSheetProps) {
  const tamagui = useTamaguiTheme();
  const haptic = useHaptic();

  const handlePin = useCallback(
    (name: string) => {
      haptic.light();
      onChange(togglePin(prefs, name));
    },
    [prefs, onChange, haptic],
  );

  const handleHide = useCallback(
    (name: string) => {
      haptic.light();
      onChange(toggleHide(prefs, name));
    },
    [prefs, onChange, haptic],
  );

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      animation="medium"
      zIndex={200000}
      dismissOnSnapToBottom
      snapPoints={[80]}
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
          <YStack gap={2}>
            <Text fontSize={17} fontWeight="600" color="$color" letterSpacing={-0.2}>
              Customize fields
            </Text>
            <Text color="$placeholderColor" fontSize={12}>
              Pin to force show. Hide to omit from cards.
            </Text>
          </YStack>
          <Pressable hitSlop={10} onPress={onReset}>
            <Text color="$primary" fontSize={13} fontWeight="600">
              Reset
            </Text>
          </Pressable>
        </XStack>

        <ScrollView showsVerticalScrollIndicator={false}>
          <YStack gap={6} paddingBottom={32}>
            {columns.map((col) => {
              const isPinned = prefs.pinned.includes(col.name);
              const isHidden = prefs.hidden.includes(col.name);
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
                  borderColor="$borderColor"
                  gap="$sm"
                >
                  <YStack flex={1} gap={2}>
                    <Text color="$color" fontSize={14} fontWeight="500" numberOfLines={1}>
                      {col.name}
                    </Text>
                    {col.type ? (
                      <Text
                        color="$placeholderColor"
                        fontSize={11}
                        fontFamily="$mono"
                        numberOfLines={1}
                      >
                        {col.type.toLowerCase()}
                      </Text>
                    ) : null}
                  </YStack>
                  <XStack gap={6}>
                    <Pressable hitSlop={6} onPress={() => handlePin(col.name)}>
                      <YStack
                        width={36}
                        height={36}
                        borderRadius={10}
                        backgroundColor={isPinned ? "$primaryMuted" : "$surfaceMuted"}
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Ionicons
                          name={isPinned ? "pin" : "pin-outline"}
                          size={16}
                          color={isPinned ? tamagui.primary.val : tamagui.placeholderColor.val}
                        />
                      </YStack>
                    </Pressable>
                    <Pressable hitSlop={6} onPress={() => handleHide(col.name)}>
                      <YStack
                        width={36}
                        height={36}
                        borderRadius={10}
                        backgroundColor={isHidden ? "$dangerMuted" : "$surfaceMuted"}
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Ionicons
                          name={isHidden ? "eye-off" : "eye-outline"}
                          size={16}
                          color={isHidden ? tamagui.danger.val : tamagui.placeholderColor.val}
                        />
                      </YStack>
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
