import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { ActionSheetIOS, Alert, Pressable } from "react-native";
import { useTheme, XStack } from "tamagui";

function HeaderIcon({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.5 : 1 })}
    >
      <Ionicons name={icon} size={24} color={theme.accent.val} />
    </Pressable>
  );
}

type QueryHeaderActionsProps = {
  onHistory: () => void;
  onSnippets: () => void;
  onSaveSnippet: () => void;
};

/** Accent icon buttons for the query screen's `headerRight`. */
export const QueryHeaderActions = memo(function QueryHeaderActions({
  onHistory,
  onSnippets,
  onSaveSnippet,
}: QueryHeaderActionsProps) {
  const openMore = () => {
    if (process.env.EXPO_OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ["Save Query as Snippet", "Cancel"], cancelButtonIndex: 1 },
        (index) => {
          if (index === 0) onSaveSnippet();
        },
      );
      return;
    }
    Alert.alert("More", undefined, [
      { text: "Save Query as Snippet", onPress: onSaveSnippet },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <XStack alignItems="center" gap={12}>
      <HeaderIcon icon="time-outline" label="History" onPress={onHistory} />
      <HeaderIcon icon="bookmark-outline" label="Snippets" onPress={onSnippets} />
      <HeaderIcon icon="ellipsis-horizontal-circle-outline" label="More" onPress={openMore} />
    </XStack>
  );
});
