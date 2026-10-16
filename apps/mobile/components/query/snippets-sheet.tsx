import { memo, useCallback, useEffect, useState } from "react";
import { Alert, ScrollView } from "react-native";
import { useHaptic } from "../../lib/haptics";
import {
  deleteSnippet,
  getSnippets,
  type QuerySnippet,
  saveSnippet,
} from "../../lib/storage/snippets";
import { AppText, Dialog, Input, ListRow, ListSection } from "../ui";

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : "Unknown error");

type SnippetsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (query: string) => void;
};

/** Saved snippets: tap to load, long-press to delete. */
export const SnippetsSheet = memo(function SnippetsSheet({
  open,
  onOpenChange,
  onSelect,
}: SnippetsSheetProps) {
  const [snippets, setSnippets] = useState<QuerySnippet[]>([]);

  const load = useCallback(() => {
    getSnippets().then(setSnippets);
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const confirmDelete = useCallback(
    (snippet: QuerySnippet) => {
      Alert.alert(`Delete “${snippet.name}”?`, "This can’t be undone.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSnippet(snippet.id);
              load();
            } catch (err) {
              console.error("[SnippetsSheet] Failed to delete snippet:", err);
              Alert.alert("Couldn’t Delete Snippet", errorMessage(err));
            }
          },
        },
      ]);
    },
    [load],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Snippets"
      description="Tap to load. Long-press to delete."
      primaryAction={{ label: "Done", onPress: () => onOpenChange(false) }}
    >
      <ScrollView style={{ maxHeight: 400 }}>
        {snippets.length === 0 ? (
          <AppText
            variant="subhead"
            tone="secondary"
            style={{ textAlign: "center" }}
            paddingVertical="$xl"
          >
            No snippets yet. Save the current query from the More menu.
          </AppText>
        ) : (
          <ListSection>
            {snippets.map((snippet) => (
              <ListRow
                key={snippet.id}
                title={snippet.name}
                subtitle={
                  <AppText variant="code" tone="secondary" numberOfLines={2}>
                    {snippet.query}
                  </AppText>
                }
                onPress={() => {
                  onSelect(snippet.query);
                  onOpenChange(false);
                }}
                onLongPress={() => confirmDelete(snippet)}
                accessibilityLabel={`${snippet.name}. Long-press to delete.`}
              />
            ))}
          </ListSection>
        )}
      </ScrollView>
    </Dialog>
  );
});

type SaveSnippetDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
};

/** Name prompt for saving the current query as a snippet. */
export const SaveSnippetDialog = memo(function SaveSnippetDialog({
  open,
  onOpenChange,
  query,
}: SaveSnippetDialogProps) {
  const haptic = useHaptic();
  const [name, setName] = useState("");

  useEffect(() => {
    if (open) setName("");
  }, [open]);

  const save = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    try {
      await saveSnippet({ name: trimmedName, query: query.trim() });
      haptic.success();
      onOpenChange(false);
      Alert.alert("Snippet Saved", `“${trimmedName}” is in your snippets.`);
    } catch (err) {
      haptic.error();
      console.error("[SaveSnippetDialog] Failed to save snippet:", err);
      Alert.alert("Couldn’t Save Snippet", errorMessage(err));
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Save Snippet"
      confirmText="Save"
      cancelText="Cancel"
      onConfirm={save}
      onCancel={() => onOpenChange(false)}
    >
      <Input
        value={name}
        onChangeText={setName}
        placeholder="Name"
        autoFocus
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        onSubmitEditing={save}
      />
    </Dialog>
  );
});
