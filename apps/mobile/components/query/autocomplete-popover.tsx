import { memo } from "react";
import { Pressable, ScrollView } from "react-native";
import { useTheme, YStack } from "tamagui";
import { AppText } from "../ui";

type AutocompletePopoverProps = {
  suggestions: string[];
  /** The typed prefix, highlighted at the start of each suggestion. */
  prefix: string;
  onSelect: (suggestion: string) => void;
};

/**
 * Keyword suggestions floating above the editor. Appears and disappears with
 * typing, so it doesn't animate.
 */
export const AutocompletePopover = memo(function AutocompletePopover({
  suggestions,
  prefix,
  onSelect,
}: AutocompletePopoverProps) {
  const theme = useTheme();

  return (
    <YStack
      position="absolute"
      bottom="100%"
      left={0}
      right={0}
      marginBottom={6}
      maxHeight={220}
      zIndex={1000}
      backgroundColor="$surfaceElevated"
      borderRadius="$md"
      borderWidth={0.5}
      borderColor="$borderSubtle"
      overflow="hidden"
      style={{
        borderCurve: "continuous",
        boxShadow: `0 6px 20px ${theme.shadowColorStrong.val}`,
      }}
    >
      <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 220 }}>
        {suggestions.map((suggestion, index) => (
          <Pressable
            key={suggestion}
            onPress={() => onSelect(suggestion)}
            accessibilityRole="button"
            accessibilityLabel={`Insert ${suggestion}`}
            style={({ pressed }) => ({
              backgroundColor: pressed ? theme.surfaceMuted.val : "transparent",
            })}
          >
            <YStack
              minHeight={44}
              justifyContent="center"
              paddingHorizontal="$md"
              borderBottomWidth={index < suggestions.length - 1 ? 0.5 : 0}
              borderBottomColor="$borderColor"
            >
              <AppText variant="subhead" fontFamily="$mono" numberOfLines={1}>
                {prefix ? (
                  <AppText variant="subhead" fontFamily="$mono" tone="accent" emphasized>
                    {suggestion.slice(0, prefix.length)}
                  </AppText>
                ) : null}
                {suggestion.slice(prefix.length)}
              </AppText>
            </YStack>
          </Pressable>
        ))}
      </ScrollView>
    </YStack>
  );
});
