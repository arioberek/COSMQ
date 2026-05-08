import { Ionicons } from "@expo/vector-icons";
import { memo, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, TextInput } from "react-native";
import { Sheet, Text, useTheme as useTamaguiTheme, XStack, YStack } from "tamagui";
import { useHaptic } from "../../lib/haptics";

export interface PickerOption {
  id: string;
  label: string;
  sublabel?: string;
}

type PickerSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  options: PickerOption[];
  selected: string[];
  multi?: boolean;
  searchable?: boolean;
  emptyText?: string;
  onSelect: (ids: string[]) => void;
};

export const PickerSheet = memo(function PickerSheet({
  open,
  onOpenChange,
  title,
  options,
  selected,
  multi = false,
  searchable = true,
  emptyText = "Nothing to pick.",
  onSelect,
}: PickerSheetProps) {
  const tamagui = useTamaguiTheme();
  const haptic = useHaptic();
  const [search, setSearch] = useState("");

  // Reset the search needle whenever the sheet is dismissed so the next time
  // it opens (potentially for a different field) the user sees the full list,
  // not the previously typed filter still applied.
  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const needle = search.trim().toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(needle) ||
        (o.sublabel ?? "").toLowerCase().includes(needle),
    );
  }, [options, search]);

  const toggle = (id: string) => {
    haptic.light();
    if (multi) {
      if (selected.includes(id)) {
        onSelect(selected.filter((s) => s !== id));
      } else {
        onSelect([...selected, id]);
      }
      return;
    }
    onSelect([id]);
    onOpenChange(false);
  };

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
          <Text fontSize={17} fontWeight="600" color="$color" letterSpacing={-0.2}>
            {title}
          </Text>
          {multi ? (
            <Pressable hitSlop={8} onPress={() => onOpenChange(false)}>
              <Text color="$primary" fontSize={13} fontWeight="600">
                Done
              </Text>
            </Pressable>
          ) : null}
        </XStack>

        {searchable && options.length > 6 ? (
          <XStack
            alignItems="center"
            backgroundColor="$surface"
            borderRadius="$sm"
            borderWidth={1}
            borderColor="$borderColor"
            paddingHorizontal="$sm"
            gap={6}
            height={36}
          >
            <Ionicons name="search" size={13} color={tamagui.placeholderColor.val} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search…"
              placeholderTextColor={tamagui.placeholderColor.val}
              autoCapitalize="none"
              autoCorrect={false}
              style={{ flex: 1, color: tamagui.color.val, fontSize: 14, paddingVertical: 0 }}
            />
            {search ? (
              <Pressable hitSlop={6} onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={14} color={tamagui.placeholderColor.val} />
              </Pressable>
            ) : null}
          </XStack>
        ) : null}

        <ScrollView showsVerticalScrollIndicator={false}>
          <YStack gap={6} paddingBottom={32}>
            {filtered.length === 0 ? (
              <Text color="$placeholderColor" fontSize={13} textAlign="center" paddingVertical="$lg">
                {emptyText}
              </Text>
            ) : (
              filtered.map((opt) => {
                const isSelected = selected.includes(opt.id);
                return (
                  <Pressable key={opt.id} onPress={() => toggle(opt.id)}>
                    <XStack
                      alignItems="center"
                      paddingHorizontal="$sm"
                      paddingVertical="$sm"
                      backgroundColor="$surface"
                      borderRadius="$sm"
                      borderWidth={1}
                      borderColor={isSelected ? "$primary" : "$borderColor"}
                      gap="$sm"
                    >
                      <YStack flex={1} gap={2}>
                        <Text color="$color" fontSize={14} fontWeight="500" numberOfLines={1}>
                          {opt.label}
                        </Text>
                        {opt.sublabel ? (
                          <Text
                            color="$placeholderColor"
                            fontSize={11}
                            fontFamily="$mono"
                            numberOfLines={1}
                          >
                            {opt.sublabel}
                          </Text>
                        ) : null}
                      </YStack>
                      <Ionicons
                        name={
                          isSelected
                            ? multi
                              ? "checkbox"
                              : "checkmark-circle"
                            : multi
                              ? "square-outline"
                              : "ellipse-outline"
                        }
                        size={20}
                        color={isSelected ? tamagui.primary.val : tamagui.placeholderColor.val}
                      />
                    </XStack>
                  </Pressable>
                );
              })
            )}
          </YStack>
        </ScrollView>
      </Sheet.Frame>
    </Sheet>
  );
});
