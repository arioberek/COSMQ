import { Ionicons } from "@expo/vector-icons";
import { Children, Fragment, isValidElement, memo, type ReactNode } from "react";
import { Pressable } from "react-native";
import { useTheme as useTamaguiTheme, XStack, YStack } from "tamagui";
import { Input } from "../ui/Input";
import { AppText } from "../ui/Text";

type BuilderSectionProps = {
  title: string;
  /** Trailing note in the section header, e.g. "2 conditions". */
  hint?: string;
  /** Renders an "Add …" row at the end of the group. */
  onAdd?: () => void;
  addLabel?: string;
  /** Footnote under the group. */
  footer?: string;
  children?: ReactNode;
};

/** Inset hairline between rows of a group, aligned with the row text. */
export const BuilderSeparator = () => (
  <YStack height={0.5} marginLeft="$md" backgroundColor="$borderColor" />
);

/**
 * Inset grouped section (same look as `ListSection`): uppercase footnote header,
 * a `$surface` group with hairlines between children, an optional add row and
 * footer. Children are rows; each should pad itself horizontally by `$md`.
 */
export const BuilderSection = memo(function BuilderSection({
  title,
  hint,
  onAdd,
  addLabel,
  footer,
  children,
}: BuilderSectionProps) {
  const tamagui = useTamaguiTheme();
  const rows = Children.toArray(children).filter(isValidElement);
  const hasGroup = rows.length > 0 || !!onAdd;

  return (
    <YStack gap={6}>
      <XStack alignItems="baseline" justifyContent="space-between" paddingHorizontal="$md">
        <AppText variant="footnote" tone="secondary" textTransform="uppercase">
          {title}
        </AppText>
        {hint ? (
          <AppText variant="footnote" tone="secondary">
            {hint}
          </AppText>
        ) : null}
      </XStack>

      {hasGroup ? (
        <YStack
          backgroundColor="$surface"
          borderRadius="$md"
          overflow="hidden"
          style={{ borderCurve: "continuous" }}
        >
          {rows.map((row, index) => (
            <Fragment key={row.key ?? index}>
              {index > 0 ? <BuilderSeparator /> : null}
              {row}
            </Fragment>
          ))}
          {onAdd ? (
            <>
              {rows.length > 0 ? <BuilderSeparator /> : null}
              <Pressable onPress={onAdd} accessibilityRole="button">
                {({ pressed }) => (
                  <XStack
                    alignItems="center"
                    gap={12}
                    minHeight={44}
                    paddingHorizontal="$md"
                    backgroundColor={pressed ? "$surfaceMuted" : "transparent"}
                  >
                    <Ionicons name="add-circle" size={22} color={tamagui.accent.val} />
                    <AppText variant="body" tone="accent">
                      {addLabel ?? "Add"}
                    </AppText>
                  </XStack>
                )}
              </Pressable>
            </>
          ) : null}
        </YStack>
      ) : null}

      {footer ? (
        <AppText variant="footnote" tone="secondary" paddingHorizontal="$md">
          {footer}
        </AppText>
      ) : null}
    </YStack>
  );
});

type BuilderChipProps = {
  label: string;
  placeholder?: string;
  tone?: "default" | "accent";
  chevron?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
  /** Allow the chip to shrink and truncate in a crowded row. */
  shrink?: boolean;
};

/** Compact `$fill` chip used for column, operator and combinator pickers. */
export const BuilderChip = memo(function BuilderChip({
  label,
  placeholder,
  tone = "default",
  chevron,
  onPress,
  accessibilityLabel,
  shrink,
}: BuilderChipProps) {
  const tamagui = useTamaguiTheme();
  const accent = tone === "accent";
  return (
    <Pressable
      onPress={onPress}
      hitSlop={{ top: 7, bottom: 7, left: 2, right: 2 }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label ?? placeholder}
      style={shrink ? { flexShrink: 1, minWidth: 0 } : undefined}
    >
      {({ pressed }) => (
        <XStack
          height={30}
          paddingHorizontal={10}
          borderRadius="$sm"
          alignItems="center"
          gap={4}
          backgroundColor={accent ? "$accentMuted" : "$fill"}
          opacity={pressed ? 0.6 : 1}
          style={{ borderCurve: "continuous" }}
        >
          <AppText
            variant="code"
            tone={accent ? "accent" : label ? "primary" : "tertiary"}
            numberOfLines={1}
            flexShrink={1}
          >
            {label || placeholder}
          </AppText>
          {chevron ? (
            <Ionicons
              name="chevron-down"
              size={12}
              color={accent ? tamagui.accent.val : tamagui.textSubtle.val}
            />
          ) : null}
        </XStack>
      )}
    </Pressable>
  );
});

type ChipListRowProps = {
  items: string[];
  onRemove: (item: string) => void;
};

/** Wrapping row of removable chips (selected columns / projected fields). */
export const ChipListRow = memo(function ChipListRow({ items, onRemove }: ChipListRowProps) {
  const tamagui = useTamaguiTheme();
  return (
    <XStack flexWrap="wrap" gap={6} paddingHorizontal="$md" paddingVertical={10}>
      {items.map((item) => (
        <XStack
          key={item}
          height={30}
          paddingLeft={10}
          paddingRight={6}
          borderRadius="$sm"
          alignItems="center"
          gap={4}
          backgroundColor="$fill"
          style={{ borderCurve: "continuous" }}
        >
          <AppText variant="code" numberOfLines={1}>
            {item}
          </AppText>
          <Pressable
            hitSlop={8}
            onPress={() => onRemove(item)}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${item}`}
          >
            <Ionicons name="close-circle" size={16} color={tamagui.textSubtle.val} />
          </Pressable>
        </XStack>
      ))}
    </XStack>
  );
});

type LimitRowProps = {
  value: number | null;
  onChangeText: (text: string) => void;
  onClear: () => void;
};

/** "Limit" form row: label left, right-aligned numeric field. */
export const LimitRow = memo(function LimitRow({ value, onChangeText, onClear }: LimitRowProps) {
  const tamagui = useTamaguiTheme();
  return (
    <XStack alignItems="center" gap="$sm" paddingHorizontal="$md" minHeight={44}>
      <AppText variant="body">Limit</AppText>
      <Input
        value={value !== null ? String(value) : ""}
        onChangeText={onChangeText}
        placeholder="None"
        keyboardType="number-pad"
        align="right"
        accessibilityLabel="Row limit"
        style={{ fontVariant: ["tabular-nums"] }}
      />
      {value !== null ? (
        <Pressable
          hitSlop={8}
          onPress={onClear}
          accessibilityRole="button"
          accessibilityLabel="Clear limit"
        >
          <Ionicons name="close-circle" size={18} color={tamagui.textSubtle.val} />
        </Pressable>
      ) : null}
    </XStack>
  );
});
