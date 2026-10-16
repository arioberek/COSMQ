import { memo, type ReactNode, useRef } from "react";
import { Pressable } from "react-native";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import { YStack } from "tamagui";
import { useHaptic } from "../lib/haptics";
import { AppText } from "./ui/Text";

const ACTION_WIDTH = 76;

type SwipeAction = {
  label: string;
  color: string;
  onPress: () => void;
};

type SwipeableRowProps = {
  children: ReactNode;
  rightActions?: SwipeAction[];
  enabled?: boolean;
};

/**
 * iOS-style trailing swipe actions: full-height colored buttons with text labels.
 * Gesture Handler + Reanimated keep the drag on the UI thread, with velocity-aware
 * snapping (a flick opens or closes regardless of distance).
 */
export const SwipeableRow = memo(function SwipeableRow({
  children,
  rightActions = [],
  enabled = true,
}: SwipeableRowProps) {
  const haptic = useHaptic();
  const ref = useRef<SwipeableMethods>(null);

  if (!enabled || rightActions.length === 0) return <>{children}</>;

  return (
    <ReanimatedSwipeable
      ref={ref}
      friction={1.5}
      rightThreshold={ACTION_WIDTH / 2}
      overshootRight={false}
      onSwipeableWillOpen={() => haptic.light()}
      renderRightActions={() => (
        <YStack flexDirection="row">
          {rightActions.map((action) => (
            <Pressable
              key={action.label}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              onPress={() => {
                ref.current?.close();
                action.onPress();
              }}
              style={({ pressed }) => ({
                width: ACTION_WIDTH,
                backgroundColor: action.color,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <AppText variant="subhead" emphasized tone="onAccent">
                {action.label}
              </AppText>
            </Pressable>
          ))}
        </YStack>
      )}
    >
      {children}
    </ReanimatedSwipeable>
  );
});
