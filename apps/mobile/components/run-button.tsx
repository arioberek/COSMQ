import { Ionicons } from "@expo/vector-icons";
import { memo, useEffect, useRef } from "react";
import { ActivityIndicator, Pressable, StyleSheet } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../hooks/useTheme";
import { AppText } from "./ui";

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const HEIGHT = 44;
const RADIUS = 12;
const PADDING_H = 18;

type RunButtonProps = {
  executing: boolean;
  onPress: () => void;
  disabled?: boolean;
  label?: string;
};

/**
 * Filled accent "Run" button. While a query executes it morphs into a round
 * spinner (state indication); press feedback is a 0.97 scale. With Reduce
 * Motion on, the morph and scale become plain crossfades.
 */
export const RunButton = memo(function RunButton({
  executing,
  onPress,
  disabled,
  label = "Run",
}: RunButtonProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0); // 0 = idle, 1 = executing
  const pressed = useSharedValue(0);
  const naturalWidth = useSharedValue(0);
  const measured = useRef(false);

  // Re-measure the idle width when the label changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: label is the trigger, not a read
  useEffect(() => {
    measured.current = false;
    naturalWidth.set(0);
  }, [label, naturalWidth]);

  useEffect(() => {
    progress.set(
      withTiming(executing ? 1 : 0, { duration: reducedMotion ? 150 : 220, easing: EASE_OUT }),
    );
  }, [executing, reducedMotion, progress]);

  const containerStyle = useAnimatedStyle(() => {
    const p = progress.get();
    const press = pressed.get();
    const base = reducedMotion
      ? { opacity: interpolate(press, [0, 1], [1, 0.75]) }
      : { transform: [{ scale: interpolate(press, [0, 1], [1, 0.97]) }] };
    const width = naturalWidth.get();
    if (width === 0 || reducedMotion) return base;
    return {
      ...base,
      width: interpolate(p, [0, 1], [width, HEIGHT], "clamp"),
      borderRadius: interpolate(p, [0, 1], [RADIUS, HEIGHT / 2], "clamp"),
      paddingHorizontal: interpolate(p, [0, 1], [PADDING_H, 0], "clamp"),
    };
  });

  const labelStyle = useAnimatedStyle(() => {
    const p = progress.get();
    return reducedMotion
      ? { opacity: interpolate(p, [0, 1], [1, 0], "clamp") }
      : {
          opacity: interpolate(p, [0, 0.4], [1, 0], "clamp"),
          transform: [{ scale: interpolate(p, [0, 0.5], [1, 0.9], "clamp") }],
        };
  });

  const spinnerStyle = useAnimatedStyle(() => {
    const p = progress.get();
    return reducedMotion
      ? { opacity: interpolate(p, [0, 1], [0, 1], "clamp") }
      : {
          opacity: interpolate(p, [0.5, 1], [0, 1], "clamp"),
          transform: [{ scale: interpolate(p, [0.5, 1], [0.9, 1], "clamp") }],
        };
  });

  const pressDuration = reducedMotion ? 100 : 120;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => pressed.set(withTiming(1, { duration: pressDuration, easing: EASE_OUT }))}
      onPressOut={() => pressed.set(withTiming(0, { duration: 160, easing: EASE_OUT }))}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={executing ? "Running query" : `${label} query`}
      accessibilityState={{ busy: executing, disabled: !!disabled }}
    >
      <Animated.View
        style={[styles.button, { backgroundColor: theme.colors.accentFill }, containerStyle]}
        onLayout={(e) => {
          // Capture the idle width once, before the first execution.
          if (!measured.current && !executing) {
            const w = e.nativeEvent.layout.width;
            if (w > 0) {
              naturalWidth.set(w);
              measured.current = true;
            }
          }
        }}
      >
        <Animated.View style={[styles.label, labelStyle]} pointerEvents="none">
          <Ionicons name="play" size={15} color={theme.colors.onAccent} />
          <AppText variant="headline" tone="onAccent" numberOfLines={1}>
            {label}
          </AppText>
        </Animated.View>

        <Animated.View style={[styles.overlay, spinnerStyle]} pointerEvents="none">
          <ActivityIndicator color={theme.colors.onAccent} size="small" />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  button: {
    height: HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    paddingHorizontal: PADDING_H,
    borderRadius: RADIUS,
    borderCurve: "continuous",
  },
  label: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});
