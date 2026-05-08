import { memo, useEffect, useRef } from "react";
import { ActivityIndicator, Pressable, StyleSheet } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

type RunButtonProps = {
  executing: boolean;
  onPress: () => void;
  disabled?: boolean;
  primaryColor: string;
  label?: string;
};

export const RunButton = memo(function RunButton({
  executing,
  onPress,
  disabled,
  primaryColor,
  label = "Run",
}: RunButtonProps) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0); // 0 = idle, 1 = executing
  const naturalWidth = useSharedValue(0);
  const measured = useRef(false);

  useEffect(() => {
    measured.current = false;
    naturalWidth.value = 0;
  }, [label, naturalWidth]);

  useEffect(() => {
    const target = executing ? 1 : 0;
    progress.value = withTiming(target, { duration: reducedMotion ? 120 : 220 });
  }, [executing, reducedMotion, progress]);

  const containerStyle = useAnimatedStyle(() => {
    if (naturalWidth.value === 0) return {};
    const width = interpolate(progress.value, [0, 1], [naturalWidth.value, 44], "clamp");
    const borderRadius = interpolate(progress.value, [0, 1], [8, 22], "clamp");
    const paddingH = interpolate(progress.value, [0, 1], [20, 0], "clamp");
    return {
      width,
      borderRadius,
      paddingHorizontal: paddingH,
    };
  });

  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.4], [1, 0], "clamp"),
    transform: [{ scale: interpolate(progress.value, [0, 0.5], [1, 0.7], "clamp") }],
  }));

  const spinnerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.5, 1], [0, 1], "clamp"),
    transform: [{ scale: interpolate(progress.value, [0.5, 1], [0.7, 1], "clamp") }],
  }));

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={styles.pressable}
      accessibilityState={{ busy: executing, disabled: !!disabled }}
    >
      <Animated.View
        style={[styles.button, { backgroundColor: primaryColor }, containerStyle]}
        onLayout={(e) => {
          // Capture natural width only once before the first execution
          if (!measured.current && !executing) {
            const w = e.nativeEvent.layout.width;
            if (w > 0) {
              naturalWidth.value = w;
              measured.current = true;
            }
          }
        }}
      >
        {/* Label */}
        <Animated.View style={[styles.overlay, labelStyle]} pointerEvents="none">
          <Animated.Text style={styles.labelText}>{label}</Animated.Text>
        </Animated.View>

        {/* Spinner */}
        <Animated.View style={[styles.overlay, spinnerStyle]} pointerEvents="none">
          <ActivityIndicator color="#fff" size="small" />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  pressable: {
    alignSelf: "flex-end",
  },
  button: {
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  labelText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
