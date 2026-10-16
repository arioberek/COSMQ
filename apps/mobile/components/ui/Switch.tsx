import { memo } from "react";
import { Switch as NativeSwitch, type SwitchProps as NativeSwitchProps } from "react-native";
import { useTheme } from "tamagui";

type SwitchProps = Omit<NativeSwitchProps, "value" | "onValueChange"> & {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

/** Platform switch (UISwitch / Material) tinted with the app accent. */
export const Switch = memo(function Switch({ checked, onCheckedChange, ...props }: SwitchProps) {
  const theme = useTheme();
  return (
    <NativeSwitch
      value={checked}
      onValueChange={onCheckedChange}
      trackColor={{ true: theme.accent.val, false: theme.fill.val }}
      ios_backgroundColor={theme.fill.val}
      {...props}
    />
  );
});
