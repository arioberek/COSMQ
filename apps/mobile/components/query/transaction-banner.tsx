import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { Pressable } from "react-native";
import Animated, { Easing, FadeIn, FadeOut } from "react-native-reanimated";
import { useTheme, XStack, YStack } from "tamagui";
import { formatCountdown } from "../../lib/sql/transactions";
import { AppText, Button } from "../ui";

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

type TransactionBannerProps = {
  /** Seconds left before auto-rollback, or null when auto-rollback is off. */
  secondsLeft: number | null;
  busy: boolean;
  onCommit: () => void;
  onRollback: () => void;
  onHide: () => void;
};

/** Inset warning bar shown while a wrapped transaction waits for commit or rollback. */
export const TransactionBanner = memo(function TransactionBanner({
  secondsLeft,
  busy,
  onCommit,
  onRollback,
  onHide,
}: TransactionBannerProps) {
  const theme = useTheme();

  return (
    <Animated.View
      entering={FadeIn.duration(200).easing(EASE_OUT)}
      exiting={FadeOut.duration(150).easing(EASE_OUT)}
    >
      <YStack
        backgroundColor="$warningMuted"
        borderRadius="$md"
        padding={14}
        gap={12}
        style={{ borderCurve: "continuous" }}
        accessibilityRole="alert"
      >
        <XStack alignItems="flex-start" gap={10}>
          <Ionicons name="time" size={20} color={theme.warning.val} style={{ marginTop: 1 }} />
          <YStack flex={1} gap={2}>
            <XStack alignItems="center" justifyContent="space-between" gap="$sm">
              <AppText variant="headline" tone="warning">
                Transaction Open
              </AppText>
              <Pressable
                onPress={onHide}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Hide transaction banner"
                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
              >
                <AppText variant="subhead" tone="warning" emphasized>
                  Hide
                </AppText>
              </Pressable>
            </XStack>
            <AppText variant="footnote" tone="secondary">
              {secondsLeft !== null ? (
                <>
                  Auto-rollback in{" "}
                  <AppText
                    variant="footnote"
                    tone="warning"
                    emphasized
                    style={{ fontVariant: ["tabular-nums"] }}
                  >
                    {formatCountdown(secondsLeft)}
                  </AppText>
                  . Commit to keep the changes, or roll back to undo them.
                </>
              ) : (
                "Auto-rollback is off. Commit to keep the changes, or roll back to undo them."
              )}
            </AppText>
          </YStack>
        </XStack>
        <XStack gap="$sm" justifyContent="flex-end">
          <Button variant="destructive" size="sm" onPress={onRollback} disabled={busy}>
            Roll Back
          </Button>
          <Button variant="tinted" size="sm" onPress={onCommit} disabled={busy}>
            Commit
          </Button>
        </XStack>
      </YStack>
    </Animated.View>
  );
});
