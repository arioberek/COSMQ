import { memo, useEffect, useState } from "react";
import { ScrollView } from "react-native";
import { getQueryHistory, type QueryHistoryItem } from "../../lib/storage/query-history";
import { AppText, Dialog, ListRow, ListSection } from "../ui";

type HistorySheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (query: string) => void;
};

/** Recent queries across connections; tap one to load it into the editor. */
export const HistorySheet = memo(function HistorySheet({
  open,
  onOpenChange,
  onSelect,
}: HistorySheetProps) {
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);

  useEffect(() => {
    if (open) getQueryHistory().then(setHistory);
  }, [open]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="History"
      primaryAction={{ label: "Done", onPress: () => onOpenChange(false) }}
    >
      <ScrollView style={{ maxHeight: 400 }}>
        {history.length === 0 ? (
          <AppText
            variant="subhead"
            tone="secondary"
            style={{ textAlign: "center" }}
            paddingVertical="$xl"
          >
            Queries you run will appear here.
          </AppText>
        ) : (
          <ListSection>
            {history.map((item) => (
              <ListRow
                key={item.id}
                title={
                  <AppText variant="code" numberOfLines={2}>
                    {item.query}
                  </AppText>
                }
                subtitle={`${item.connectionName} · ${new Date(item.timestamp).toLocaleDateString()}`}
                onPress={() => {
                  onSelect(item.query);
                  onOpenChange(false);
                }}
                accessibilityLabel={`Load query: ${item.query}`}
              />
            ))}
          </ListSection>
        )}
      </ScrollView>
    </Dialog>
  );
});
