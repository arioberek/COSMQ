import { Ionicons } from "@expo/vector-icons";
import { memo, useCallback } from "react";
import { Pressable } from "react-native";
import { useTheme as useTamaguiTheme, XStack, YStack } from "tamagui";
import { useHaptic } from "../../lib/haptics";
import type { ColumnPrefs } from "../../lib/storage/results-prefs";
import type { ColumnInfo } from "../../lib/types";
import { ModalSheet } from "../ui/Dialog";
import { ListRow, ListSection } from "../ui/List";
import { AppText } from "../ui/Text";

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

const ToggleIcon = memo(function ToggleIcon({
  active,
  icon,
  activeIcon,
  label,
  onPress,
}: {
  active: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const tamagui = useTamaguiTheme();
  return (
    <Pressable
      hitSlop={6}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
    >
      {({ pressed }) => (
        <YStack
          width={34}
          height={34}
          borderRadius="$full"
          backgroundColor={active ? "$accentMuted" : "$fill"}
          alignItems="center"
          justifyContent="center"
          opacity={pressed ? 0.6 : 1}
        >
          <Ionicons
            name={active ? activeIcon : icon}
            size={16}
            color={active ? tamagui.accent.val : tamagui.textMuted.val}
          />
        </YStack>
      )}
    </Pressable>
  );
});

export const ColumnCustomizeSheet = memo(function ColumnCustomizeSheet({
  open,
  onOpenChange,
  columns,
  prefs,
  onChange,
  onReset,
}: ColumnCustomizeSheetProps) {
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

  const customized = prefs.pinned.length + prefs.hidden.length > 0;

  return (
    <ModalSheet open={open} onOpenChange={onOpenChange} title="Customize Fields" snapPoints={[80]}>
      <ListSection footer="Pinned fields always show first. Hidden fields are left out of cards, the table and JSON.">
        {columns.map((col, idx) => {
          const isPinned = prefs.pinned.includes(col.name);
          const isHidden = prefs.hidden.includes(col.name);
          return (
            <ListRow
              // Suffix the index so duplicate column names from a join
              // without aliases don't collide as React keys. Pin/hide
              // prefs themselves are still keyed by display name —
              // duplicates share the same toggle state by design.
              // biome-ignore lint/suspicious/noArrayIndexKey: unaliased joins can repeat column names
              key={`${col.name}-${idx}`}
              title={
                <AppText variant="body" tone={isHidden ? "tertiary" : "primary"} numberOfLines={1}>
                  {col.name}
                </AppText>
              }
              subtitle={col.type ? col.type.toLowerCase() : undefined}
              accessory={
                <XStack gap="$sm">
                  <ToggleIcon
                    active={isPinned}
                    icon="pin-outline"
                    activeIcon="pin"
                    label={isPinned ? `Unpin ${col.name}` : `Pin ${col.name}`}
                    onPress={() => handlePin(col.name)}
                  />
                  <ToggleIcon
                    active={isHidden}
                    icon="eye-outline"
                    activeIcon="eye-off"
                    label={isHidden ? `Show ${col.name}` : `Hide ${col.name}`}
                    onPress={() => handleHide(col.name)}
                  />
                </XStack>
              }
            />
          );
        })}
      </ListSection>

      <ListSection>
        <ListRow
          title="Reset to Defaults"
          tint
          disabled={!customized}
          onPress={onReset}
          accessibilityLabel="Reset column customization"
        />
      </ListSection>
    </ModalSheet>
  );
});
