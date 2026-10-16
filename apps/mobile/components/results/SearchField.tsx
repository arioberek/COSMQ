import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { Pressable } from "react-native";
import { useTheme, XStack } from "tamagui";
import { Input } from "../ui/Input";

type SearchFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

/** iOS search field: `$fill` capsule-ish field with a magnifier and a clear button. */
export const SearchField = memo(function SearchField({
  value,
  onChangeText,
  placeholder = "Search",
}: SearchFieldProps) {
  const theme = useTheme();
  return (
    <XStack
      flex={1}
      height={36}
      alignItems="center"
      gap={6}
      paddingHorizontal={8}
      borderRadius="$md"
      backgroundColor="$fill"
      style={{ borderCurve: "continuous" }}
    >
      <Ionicons name="search" size={16} color={theme.textSubtle.val} />
      <Input
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel={placeholder}
        style={{ paddingVertical: 0, height: 36 }}
      />
      {value ? (
        <Pressable
          hitSlop={10}
          onPress={() => onChangeText("")}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <Ionicons name="close-circle" size={16} color={theme.textSubtle.val} />
        </Pressable>
      ) : null}
    </XStack>
  );
});
