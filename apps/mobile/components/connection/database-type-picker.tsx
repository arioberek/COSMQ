import { memo } from "react";
import { Pressable } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";
import { DATABASE_LABELS } from "../../lib/database-meta";
import type { DatabaseType } from "../../lib/types";
import { DatabaseIcon } from "../database-icon";
import { AppText } from "../ui";

const DATABASE_TYPES: DatabaseType[] = [
  "postgres",
  "mysql",
  "mariadb",
  "cockroachdb",
  "mongodb",
  "sqlite",
];

type DatabaseTypePickerProps = {
  value: DatabaseType;
  onChange: (type: DatabaseType) => void;
};

/** Three-column grid of database tiles. The selected tile gets an accent ring and tint. */
export const DatabaseTypePicker = memo(function DatabaseTypePicker({
  value,
  onChange,
}: DatabaseTypePickerProps) {
  const theme = useTheme();

  return (
    <XStack flexWrap="wrap" gap="$sm" accessibilityRole="radiogroup">
      {DATABASE_TYPES.map((type) => {
        const selected = value === type;
        return (
          <Pressable
            key={type}
            onPress={() => onChange(type)}
            accessibilityRole="radio"
            accessibilityLabel={DATABASE_LABELS[type]}
            accessibilityState={{ selected, checked: selected }}
            style={({ pressed }) => ({ flexGrow: 1, flexBasis: "30%", opacity: pressed ? 0.6 : 1 })}
          >
            <YStack
              alignItems="center"
              gap={6}
              paddingTop={12}
              paddingBottom={10}
              borderRadius="$md"
              style={{ borderCurve: "continuous" }}
              borderWidth={2}
              borderColor={selected ? "$accent" : "transparent"}
              backgroundColor={selected ? "$accentMuted" : "$surface"}
            >
              <DatabaseIcon
                type={type}
                size={26}
                color={selected ? theme.accent.val : theme.color.val}
              />
              <AppText
                variant="footnote"
                emphasized={selected}
                tone={selected ? "accent" : "secondary"}
                numberOfLines={1}
              >
                {DATABASE_LABELS[type]}
              </AppText>
            </YStack>
          </Pressable>
        );
      })}
    </XStack>
  );
});
