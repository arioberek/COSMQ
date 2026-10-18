import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import Animated, { Easing, FadeIn, FadeOut } from "react-native-reanimated";
import { useTheme, XStack, YStack } from "tamagui";
import { AppText, Button } from "../ui";

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

type QueryErrorProps = {
  message: string;
  retrying: boolean;
  onRetry: () => void;
  /** Defaults to "Query Failed". */
  title?: string;
  /** Defaults to "Retry". */
  actionLabel?: string;
  /** Shown while `retrying`. Defaults to "Retrying…". */
  busyLabel?: string;
};

/** `$dangerMuted` inset block with the selectable error and a Retry action. */
export const QueryError = memo(function QueryError({
  message,
  retrying,
  onRetry,
  title = "Query Failed",
  actionLabel = "Retry",
  busyLabel = "Retrying…",
}: QueryErrorProps) {
  const theme = useTheme();

  return (
    <Animated.View
      entering={FadeIn.duration(200).easing(EASE_OUT)}
      exiting={FadeOut.duration(150).easing(EASE_OUT)}
    >
      <YStack
        backgroundColor="$dangerMuted"
        borderRadius="$md"
        paddingTop={14}
        paddingHorizontal={14}
        paddingBottom={4}
        gap={4}
        style={{ borderCurve: "continuous" }}
        accessibilityRole="alert"
      >
        <XStack alignItems="center" gap={8}>
          <Ionicons name="alert-circle" size={20} color={theme.danger.val} />
          <AppText variant="headline" tone="danger">
            {title}
          </AppText>
        </XStack>
        <AppText variant="subhead" tone="danger" selectable>
          {message}
        </AppText>
        <XStack marginLeft={-14}>
          <Button variant="plain" size="sm" onPress={onRetry} disabled={retrying}>
            {retrying ? busyLabel : actionLabel}
          </Button>
        </XStack>
      </YStack>
    </Animated.View>
  );
});
