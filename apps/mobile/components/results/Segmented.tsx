import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { memo } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { useTheme } from "../../hooks/useTheme";

type SegmentedProps = {
  values: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/**
 * Native `UISegmentedControl` on iOS. Android and web use the library's JS
 * fallback, whose slider doesn't follow a `selectedIndex` changed after mount;
 * keying by the index re-mounts it in place, which also matches the "segment
 * switches don't animate" rule.
 */
export const Segmented = memo(function Segmented({
  values,
  selectedIndex,
  onChange,
  style,
  accessibilityLabel,
}: SegmentedProps) {
  const theme = useTheme();
  return (
    <SegmentedControl
      key={process.env.EXPO_OS === "ios" ? "native" : `js-${selectedIndex}`}
      values={values}
      selectedIndex={selectedIndex}
      onChange={(e) => onChange(e.nativeEvent.selectedSegmentIndex)}
      appearance={theme.mode}
      style={style}
      accessibilityLabel={accessibilityLabel}
    />
  );
});
