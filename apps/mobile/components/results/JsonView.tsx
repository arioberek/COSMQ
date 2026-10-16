import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { memo, useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView } from "react-native";
import { XStack, YStack } from "tamagui";
import { type AppTheme, useTheme } from "../../hooks/useTheme";
import { useHaptic } from "../../lib/haptics";
import type { ColumnInfo } from "../../lib/types";
import { EmptyState } from "../ui/EmptyState";
import { AppText } from "../ui/Text";
import { stringifyJson } from "./format";

type JsonViewProps = {
  rows: Record<string, unknown>[];
  columns: ColumnInfo[];
};

type JsonColors = {
  key: string;
  index: string;
  string: string;
  number: string;
  literal: string;
  punctuation: string;
  chevron: string;
};

const colorsFrom = (theme: AppTheme): JsonColors => ({
  key: theme.syntax.operator,
  index: theme.colors.textSubtle,
  string: theme.syntax.string,
  number: theme.syntax.number,
  literal: theme.syntax.keyword,
  punctuation: theme.syntax.punctuation,
  chevron: theme.colors.textSubtle,
});

const INDENT = 14;

const PRIMITIVE = (v: unknown) => v === null || (typeof v !== "object" && typeof v !== "function");

const primitiveColor = (data: unknown, c: JsonColors): string => {
  if (data === null || typeof data === "boolean") return c.literal;
  if (typeof data === "string") return c.string;
  if (typeof data === "number" || typeof data === "bigint") return c.number;
  return c.punctuation;
};

const JsonNode = memo(function JsonNode({
  data,
  name,
  isIndex,
  depth,
  defaultOpen,
  colors,
}: {
  data: unknown;
  name?: string;
  isIndex?: boolean;
  depth: number;
  defaultOpen: boolean;
  colors: JsonColors;
}) {
  const haptic = useHaptic();
  const [open, setOpen] = useState(defaultOpen);

  const copy = useCallback(async () => {
    try {
      await Clipboard.setStringAsync(stringifyJson(data));
      haptic.light();
    } catch {
      // Clipboard write can throw on Android (permission denied) or when
      // the native module isn't available; swallow so the long-press
      // doesn't surface as an unhandled rejection.
    }
  }, [data, haptic]);

  const label =
    name !== undefined ? (
      <AppText variant="code" style={{ color: isIndex ? colors.index : colors.key }}>
        {isIndex ? name : `"${name}"`}
        <AppText variant="code" style={{ color: colors.punctuation }}>
          :
        </AppText>
      </AppText>
    ) : null;

  if (PRIMITIVE(data)) {
    const display = data === null ? "null" : typeof data === "string" ? `"${data}"` : String(data);
    return (
      <Pressable onLongPress={copy} delayLongPress={300}>
        {/* Leaf rows line up with the labels of expandable siblings. */}
        <XStack paddingLeft={depth * INDENT + INDENT} alignItems="center" gap={6} minHeight={22}>
          {label}
          <AppText
            variant="code"
            selectable
            numberOfLines={1}
            flexShrink={1}
            style={{ color: primitiveColor(data, colors) }}
          >
            {display}
          </AppText>
        </XStack>
      </Pressable>
    );
  }

  const isArray = Array.isArray(data);
  const entries = isArray
    ? (data as unknown[]).map((v, i) => [String(i), v] as const)
    : Object.entries(data as Record<string, unknown>);

  return (
    <YStack>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        onLongPress={copy}
        delayLongPress={350}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <XStack paddingLeft={depth * INDENT} alignItems="center" gap={2} minHeight={22}>
          <XStack width={INDENT - 2} alignItems="center">
            <Ionicons
              name={open ? "chevron-down" : "chevron-forward"}
              size={11}
              color={colors.chevron}
            />
          </XStack>
          <XStack alignItems="center" gap={6}>
            {label}
            <AppText variant="code" style={{ color: colors.punctuation }}>
              {isArray ? `[ ${entries.length} ]` : `{ ${entries.length} }`}
            </AppText>
          </XStack>
        </XStack>
      </Pressable>
      {open
        ? entries.map(([k, v]) => (
            <JsonNode
              key={`${depth}-${k}`}
              data={v}
              name={isArray ? `[${k}]` : k}
              isIndex={isArray}
              depth={depth + 1}
              defaultOpen={depth < 1}
              colors={colors}
            />
          ))
        : null}
    </YStack>
  );
});

export const JsonView = memo(function JsonView({ rows, columns }: JsonViewProps) {
  const theme = useTheme();
  const colors = useMemo(() => colorsFrom(theme), [theme]);
  const data = useMemo(
    () =>
      rows.map((row) => {
        const obj: Record<string, unknown> = {};
        for (const col of columns) obj[col.name] = row[col.name];
        return obj;
      }),
    [rows, columns],
  );

  if (rows.length === 0) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" paddingVertical="$xl">
        <EmptyState
          icon={<Ionicons name="code-slash-outline" size={40} color={theme.colors.textSubtle} />}
          title="No Matching Rows"
          message="No rows match the current filter."
        />
      </YStack>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
      <YStack
        backgroundColor="$surface"
        borderRadius="$md"
        paddingVertical={12}
        paddingHorizontal={12}
        style={{ borderCurve: "continuous" }}
      >
        <JsonNode data={data} depth={0} defaultOpen colors={colors} />
      </YStack>
    </ScrollView>
  );
});
