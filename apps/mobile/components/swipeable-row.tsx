import { Ionicons } from "@expo/vector-icons";
import { memo, type ReactNode, useEffect, useRef } from "react";
import { useHaptic } from "../lib/haptics";
import {
  Animated,
  type GestureResponderEvent,
  PanResponder,
  type PanResponderGestureState,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useTheme, XStack } from "tamagui";

const ACTION_BUTTON_SIZE = 44;
const ACTION_GAP = 8;
const ACTION_PADDING_RIGHT = 12;
// Threshold at which the row "locks in" to the open position
const OPEN_THRESHOLD = 0.15;
const CLOSE_THRESHOLD = 0.5;
// Haptic fires once when drag crosses this fraction of the open width
const HAPTIC_THRESHOLD = 0.35;

type SwipeAction = {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
};

type SwipeableRowProps = {
  children: ReactNode;
  rightActions?: SwipeAction[];
  enabled?: boolean;
};

const calculateActionsWidth = (actionsCount: number) => {
  if (actionsCount === 0) return 0;
  return actionsCount * ACTION_BUTTON_SIZE + (actionsCount - 1) * ACTION_GAP + ACTION_PADDING_RIGHT;
};

export const SwipeableRow = memo(function SwipeableRow({
  children,
  rightActions = [],
  enabled = true,
}: SwipeableRowProps) {
  const theme = useTheme();
  const haptic = useHaptic();
  const translateX = useRef(new Animated.Value(0)).current;
  const offsetX = useRef(0);
  const isOpen = useRef(false);
  const hapticFired = useRef(false);
  const rightWidth = calculateActionsWidth(rightActions.length);

  const enabledRef = useRef(enabled);
  const rightActionsRef = useRef(rightActions);
  const rightWidthRef = useRef(rightWidth);

  enabledRef.current = enabled;
  rightActionsRef.current = rightActions;
  rightWidthRef.current = rightWidth;

  const animateTo = (toValue: number, open: boolean) => {
    if (open && !isOpen.current && !hapticFired.current) {
      haptic.light();
    }
    isOpen.current = open;
    offsetX.current = toValue;

    Animated.spring(translateX, {
      toValue,
      useNativeDriver: true,
      // Springier config — slight overshoot feel without being bouncy
      damping: 14,
      stiffness: 150,
      mass: 1,
    }).start();
  };

  const snapToOpen = () => animateTo(-rightWidthRef.current, true);
  const snapToClosed = () => {
    isOpen.current = false;
    offsetX.current = 0;
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      damping: 16,
      stiffness: 180,
    }).start();
  };

  const handleMove = (_: GestureResponderEvent, gestureState: PanResponderGestureState) => {
    const newValue = offsetX.current + gestureState.dx;
    const clampedX = Math.max(-rightWidthRef.current - 20, Math.min(20, newValue));
    translateX.setValue(clampedX);

    // Fire a single haptic tick when drag crosses the "halfway to open" threshold
    const hapticPoint = -rightWidthRef.current * HAPTIC_THRESHOLD;
    if (!isOpen.current) {
      if (newValue < hapticPoint && !hapticFired.current) {
        hapticFired.current = true;
        haptic.light();
      } else if (newValue > hapticPoint && hapticFired.current) {
        hapticFired.current = false;
      }
    }
  };

  const handleRelease = (_: GestureResponderEvent, gestureState: PanResponderGestureState) => {
    hapticFired.current = false;
    const finalPosition = offsetX.current + gestureState.dx;
    const hasVelocity = Math.abs(gestureState.vx) > 0.05;

    if (hasVelocity) {
      if (gestureState.vx < 0 && rightActionsRef.current.length > 0) {
        snapToOpen();
      } else {
        snapToClosed();
      }
    } else {
      const openThreshold = -rightWidthRef.current * OPEN_THRESHOLD;
      const closeThreshold = -rightWidthRef.current * CLOSE_THRESHOLD;

      if (isOpen.current) {
        if (finalPosition > closeThreshold) {
          snapToClosed();
        } else {
          snapToOpen();
        }
      } else {
        if (finalPosition < openThreshold && rightActionsRef.current.length > 0) {
          snapToOpen();
        } else {
          snapToClosed();
        }
      }
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (!enabledRef.current) return false;
        const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
        return isHorizontal && Math.abs(gestureState.dx) > 3;
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        if (!enabledRef.current) return false;
        const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
        return isHorizontal && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        translateX.stopAnimation();
        hapticFired.current = false;
      },
      onPanResponderMove: handleMove,
      onPanResponderRelease: handleRelease,
      onPanResponderTerminate: () => {
        hapticFired.current = false;
        if (isOpen.current) {
          animateTo(-rightWidthRef.current, true);
        } else {
          snapToClosed();
        }
      },
    }),
  ).current;

  const close = () => {
    hapticFired.current = false;
    isOpen.current = false;
    offsetX.current = 0;
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      damping: 16,
      stiffness: 180,
    }).start();
  };

  const actionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (actionTimeoutRef.current) {
        clearTimeout(actionTimeoutRef.current);
        actionTimeoutRef.current = null;
      }
    };
  }, []);

  const handleActionPress = (action: SwipeAction) => {
    close();
    if (actionTimeoutRef.current) {
      clearTimeout(actionTimeoutRef.current);
    }
    actionTimeoutRef.current = setTimeout(() => {
      action.onPress();
      actionTimeoutRef.current = null;
    }, 200);
  };

  // Reveal: opacity + each action slides in from the right as the row opens
  const actionsProgress = translateX.interpolate({
    inputRange: [-rightWidth, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  if (rightActions.length === 0 || !enabled) {
    return <View>{children}</View>;
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.actionsContainer, { opacity: actionsProgress }]}>
        <XStack
          height="100%"
          alignItems="center"
          gap={ACTION_GAP}
          paddingRight={ACTION_PADDING_RIGHT}
        >
          {rightActions.map((action, index) => {
            // Each icon slides in from slightly right as the row opens
            const slideTranslate = translateX.interpolate({
              inputRange: [-rightWidth, -rightWidth * 0.3, 0],
              outputRange: [0, 4 + index * 6, 16 + index * 8],
              extrapolate: "clamp",
            });
            return (
              <Animated.View
                key={`${String(action.icon)}-${index}`}
                style={{ transform: [{ translateX: slideTranslate }] }}
              >
                <Pressable
                  style={[styles.actionButton, { backgroundColor: action.color }]}
                  onPress={() => handleActionPress(action)}
                >
                  <Ionicons name={action.icon} size={20} color={theme.textOnAccent.val} />
                </Pressable>
              </Animated.View>
            );
          })}
        </XStack>
      </Animated.View>

      <Animated.View
        style={[
          styles.contentContainer,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
  },
  actionsContainer: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  contentContainer: {
    backgroundColor: "transparent",
  },
  actionButton: {
    width: ACTION_BUTTON_SIZE,
    height: ACTION_BUTTON_SIZE,
    borderRadius: ACTION_BUTTON_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
