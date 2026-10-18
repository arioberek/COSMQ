import { Ionicons } from "@expo/vector-icons";
import {
  Children,
  cloneElement,
  isValidElement,
  memo,
  type ReactElement,
  type ReactNode,
} from "react";
import { Pressable } from "react-native";
import { useTheme, View, XStack, YStack } from "tamagui";
import { AppText } from "./Text";

type IconName = keyof typeof Ionicons.glyphMap;

/** iOS Settings-style icon: white glyph on a colored rounded square. */
export const ListIcon = memo(function ListIcon({ name, color }: { name: IconName; color: string }) {
  const theme = useTheme();
  return (
    <View
      width={29}
      height={29}
      borderRadius={7}
      style={{ borderCurve: "continuous" }}
      backgroundColor={color}
      alignItems="center"
      justifyContent="center"
    >
      <Ionicons name={name} size={17} color={theme.textOnAccent.val} />
    </View>
  );
});

type ListSectionProps = {
  title?: string;
  footer?: ReactNode;
  children: ReactNode;
};

/** Inset grouped section: rounded container, hairlines between rows. */
export function ListSection({ title, footer, children }: ListSectionProps) {
  const rows = Children.toArray(children).filter(isValidElement) as ReactElement<ListRowProps>[];

  return (
    <YStack gap={6}>
      {title ? (
        <AppText
          variant="footnote"
          tone="secondary"
          paddingHorizontal="$md"
          textTransform="uppercase"
        >
          {title}
        </AppText>
      ) : null}
      <YStack
        backgroundColor="$surface"
        borderRadius="$md"
        overflow="hidden"
        style={{ borderCurve: "continuous" }}
      >
        {rows.map((row, index) => cloneElement(row, { showSeparator: index < rows.length - 1 }))}
      </YStack>
      {footer ? (
        typeof footer === "string" ? (
          <AppText variant="footnote" tone="secondary" paddingHorizontal="$md">
            {footer}
          </AppText>
        ) : (
          footer
        )
      ) : null}
    </YStack>
  );
}

export type ListRowProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Trailing secondary text, e.g. the current value of a setting. */
  value?: ReactNode;
  icon?: ReactNode;
  /** Trailing element; "chevron" renders the standard disclosure indicator. */
  accessory?: "chevron" | "check" | ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  destructive?: boolean;
  tint?: boolean;
  disabled?: boolean;
  /** Injected by ListSection. */
  showSeparator?: boolean;
  accessibilityLabel?: string;
};

export const ListRow = memo(function ListRow({
  title,
  subtitle,
  value,
  icon,
  accessory,
  onPress,
  onLongPress,
  destructive,
  tint,
  disabled,
  showSeparator,
  accessibilityLabel,
}: ListRowProps) {
  const theme = useTheme();
  const titleTone = destructive ? "danger" : tint ? "accent" : "primary";

  const trailing =
    accessory === "chevron" ? (
      <Ionicons name="chevron-forward" size={17} color={theme.textSubtle.val} />
    ) : accessory === "check" ? (
      <Ionicons name="checkmark" size={20} color={theme.accent.val} />
    ) : (
      accessory
    );

  const content = (
    <XStack alignItems="center" minHeight={44} paddingLeft="$md" gap={12}>
      {icon}
      <XStack
        flex={1}
        alignItems="center"
        gap="$sm"
        paddingVertical={11}
        paddingRight="$md"
        borderBottomWidth={showSeparator ? 0.5 : 0}
        borderBottomColor="$borderColor"
        minHeight={44}
      >
        <YStack flex={1} minWidth={0} gap={2}>
          {typeof title === "string" ? (
            <AppText variant="body" tone={titleTone} numberOfLines={1}>
              {title}
            </AppText>
          ) : (
            title
          )}
          {subtitle ? (
            typeof subtitle === "string" ? (
              <AppText variant="footnote" tone="secondary" numberOfLines={2}>
                {subtitle}
              </AppText>
            ) : (
              subtitle
            )
          ) : null}
        </YStack>
        {value != null ? (
          typeof value === "string" || typeof value === "number" ? (
            <AppText variant="body" tone="secondary" numberOfLines={1} flexShrink={1}>
              {value}
            </AppText>
          ) : (
            value
          )
        ) : null}
        {trailing}
      </XStack>
    </XStack>
  );

  if (!onPress && !onLongPress) return content;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (typeof title === "string" ? title : undefined)}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => ({
        backgroundColor: pressed ? theme.surfaceMuted.val : "transparent",
        opacity: disabled ? 0.4 : 1,
      })}
    >
      {content}
    </Pressable>
  );
});
