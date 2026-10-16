import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { Pressable } from "react-native";
import { useTheme, XStack } from "tamagui";
import { AppText } from "../ui";

type ChipTone = "default" | "selected" | "warning";

type ChipProps = {
  label: string;
  onPress: () => void;
  /** Render the label in the code font (SQL fragments). */
  mono?: boolean;
  tone?: ChipTone;
  icon?: keyof typeof Ionicons.glyphMap;
  accessibilityLabel?: string;
};

const BACKGROUND: Record<ChipTone, string> = {
  default: "$fill",
  selected: "$accentMuted",
  warning: "$warningMuted",
};

const TEXT_TONE = { default: "primary", selected: "accent", warning: "warning" } as const;

/** Capsule chip: `$fill` background, subhead label, dims while pressed. */
export const Chip = memo(function Chip({
  label,
  onPress,
  mono,
  tone = "default",
  icon,
  accessibilityLabel,
}: ChipProps) {
  const theme = useTheme();
  const iconColor =
    tone === "selected"
      ? theme.accent.val
      : tone === "warning"
        ? theme.warning.val
        : theme.color.val;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: tone === "selected" }}
      hitSlop={{ top: 6, bottom: 6 }}
      style={({ pressed }) => ({ maxWidth: "100%", opacity: pressed ? 0.55 : 1 })}
    >
      <XStack
        height={32}
        paddingHorizontal={12}
        gap={6}
        alignItems="center"
        borderRadius="$full"
        backgroundColor={BACKGROUND[tone]}
      >
        {icon ? <Ionicons name={icon} size={15} color={iconColor} /> : null}
        <AppText
          variant="subhead"
          tone={TEXT_TONE[tone]}
          {...(mono ? { fontFamily: "$mono" } : null)}
          style={{ fontVariant: ["tabular-nums"] }}
          numberOfLines={1}
          flexShrink={1}
        >
          {label}
        </AppText>
      </XStack>
    </Pressable>
  );
});
