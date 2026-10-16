import { memo } from "react";
import { XStack, YStack } from "tamagui";
import { STARTER_QUERIES } from "../../lib/sql/presets";
import type { DatabaseType } from "../../lib/types";
import { AppText } from "../ui";
import { Chip } from "./chip";

type QueryPlaceholderProps = {
  type: DatabaseType;
  onPick: (query: string) => void;
};

/** Empty results area: a short hint plus one-tap starter queries. */
export const QueryPlaceholder = memo(function QueryPlaceholder({
  type,
  onPick,
}: QueryPlaceholderProps) {
  const starters = STARTER_QUERIES[type] ?? [];

  return (
    <YStack flex={1} alignItems="center" justifyContent="center" gap="$sm" paddingHorizontal="$lg">
      <AppText variant="title3" style={{ textAlign: "center" }}>
        Ready When You Are
      </AppText>
      <AppText variant="subhead" tone="secondary" style={{ textAlign: "center" }} maxWidth={320}>
        {type === "mongodb"
          ? "Try {} to list documents, or db.runCommand({listCollections:1})."
          : "Try a starter query, or tap Tables to browse the schema."}
      </AppText>
      {starters.length > 0 ? (
        <XStack
          alignSelf="stretch"
          flexWrap="wrap"
          justifyContent="center"
          gap="$sm"
          marginTop="$sm"
        >
          {starters.map((starter) => (
            <Chip key={starter} label={starter} mono onPress={() => onPick(starter)} />
          ))}
        </XStack>
      ) : null}
    </YStack>
  );
});
