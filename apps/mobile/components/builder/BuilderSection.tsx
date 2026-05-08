import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { Pressable } from "react-native";
import { Text, useTheme as useTamaguiTheme, XStack, YStack } from "tamagui";

type BuilderSectionProps = {
  title: string;
  hint?: string;
  onAdd?: () => void;
  addLabel?: string;
  children: React.ReactNode;
};

export const BuilderSection = memo(function BuilderSection({
  title,
  hint,
  onAdd,
  addLabel,
  children,
}: BuilderSectionProps) {
  const tamagui = useTamaguiTheme();
  return (
    <YStack gap={6}>
      <XStack alignItems="center" justifyContent="space-between">
        <XStack alignItems="baseline" gap={6}>
          <Text
            color="$placeholderColor"
            fontSize={11}
            fontFamily="$mono"
            textTransform="uppercase"
            letterSpacing={0.5}
            fontWeight="700"
          >
            {title}
          </Text>
          {hint ? (
            <Text color="$placeholderColor" fontSize={11}>
              {hint}
            </Text>
          ) : null}
        </XStack>
        {onAdd ? (
          <Pressable hitSlop={8} onPress={onAdd}>
            <XStack
              alignItems="center"
              gap={3}
              paddingHorizontal={8}
              paddingVertical={4}
              borderRadius={999}
              backgroundColor="$primaryMuted"
            >
              <Ionicons name="add" size={12} color={tamagui.primary.val} />
              <Text color="$primary" fontSize={11} fontWeight="600">
                {addLabel ?? "Add"}
              </Text>
            </XStack>
          </Pressable>
        ) : null}
      </XStack>
      {children}
    </YStack>
  );
});
