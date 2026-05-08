import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { memo, useCallback, useState } from "react";
import { Pressable, ScrollView } from "react-native";
import { Text, useTheme as useTamaguiTheme, XStack, YStack } from "tamagui";
import { useHaptic } from "../../lib/haptics";
import type { ColumnInfo } from "../../lib/types";
import { stringifyJson } from "./format";

type JsonViewProps = {
  rows: Record<string, unknown>[];
  columns: ColumnInfo[];
};

const TYPE_COLOR: Record<string, string> = {
  string: "$success",
  number: "$warning",
  boolean: "$primary",
  null: "$placeholderColor",
};

const PRIMITIVE = (v: unknown) => v === null || (typeof v !== "object" && typeof v !== "function");

const JsonNode = memo(function JsonNode({
  data,
  name,
  depth,
  defaultOpen,
}: {
  data: unknown;
  name?: string;
  depth: number;
  defaultOpen: boolean;
}) {
  const tamagui = useTamaguiTheme();
  const haptic = useHaptic();
  const [open, setOpen] = useState(defaultOpen);

  const copy = useCallback(async () => {
    await Clipboard.setStringAsync(stringifyJson(data));
    haptic.light();
  }, [data, haptic]);

  if (PRIMITIVE(data)) {
    const display =
      data === null
        ? "null"
        : typeof data === "string"
          ? `"${data}"`
          : String(data);
    const color =
      data === null
        ? TYPE_COLOR.null
        : typeof data === "string"
          ? TYPE_COLOR.string
          : typeof data === "number"
            ? TYPE_COLOR.number
            : typeof data === "boolean"
              ? TYPE_COLOR.boolean
              : "$color";
    return (
      <Pressable onLongPress={copy} delayLongPress={300}>
        <XStack paddingLeft={depth * 12} alignItems="center" gap={6} paddingVertical={2}>
          {name !== undefined ? (
            <Text color="$placeholderColor" fontSize={12} fontFamily="$mono" selectable>
              {name}:
            </Text>
          ) : null}
          <Text color={color} fontSize={12} fontFamily="$mono" selectable numberOfLines={1}>
            {display}
          </Text>
        </XStack>
      </Pressable>
    );
  }

  const isArray = Array.isArray(data);
  const entries = isArray
    ? (data as unknown[]).map((v, i) => [String(i), v] as const)
    : Object.entries(data as Record<string, unknown>);
  const open2 = open;

  return (
    <YStack>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        onLongPress={copy}
        delayLongPress={350}
      >
        <XStack paddingLeft={depth * 12} alignItems="center" gap={6} paddingVertical={2}>
          <Ionicons
            name={open2 ? "chevron-down" : "chevron-forward"}
            size={12}
            color={tamagui.placeholderColor.val}
          />
          {name !== undefined ? (
            <Text color="$placeholderColor" fontSize={12} fontFamily="$mono">
              {name}:
            </Text>
          ) : null}
          <Text color="$color" fontSize={12} fontFamily="$mono">
            {isArray ? `[ ${entries.length} ]` : `{ ${entries.length} }`}
          </Text>
        </XStack>
      </Pressable>
      {open2
        ? entries.map(([k, v]) => (
            <JsonNode
              key={`${depth}-${k}`}
              data={v}
              name={isArray ? `[${k}]` : k}
              depth={depth + 1}
              defaultOpen={depth < 1}
            />
          ))
        : null}
    </YStack>
  );
});

export const JsonView = memo(function JsonView({ rows, columns }: JsonViewProps) {
  const data = rows.map((row) => {
    const obj: Record<string, unknown> = {};
    for (const col of columns) obj[col.name] = row[col.name];
    return obj;
  });

  if (rows.length === 0) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$lg" gap="$sm">
        <Ionicons name="code-slash-outline" size={28} color="#8a8aa0" />
        <Text color="$placeholderColor" fontSize={14}>
          No rows match the current view.
        </Text>
      </YStack>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <YStack
        backgroundColor="$surface"
        borderWidth={1}
        borderColor="$borderColor"
        borderRadius="$md"
        padding="$sm"
        paddingBottom="$lg"
        style={{ borderCurve: "continuous" }}
      >
        <JsonNode data={data} depth={0} defaultOpen />
      </YStack>
    </ScrollView>
  );
});
