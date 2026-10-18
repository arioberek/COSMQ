import SegmentedControl from "@react-native-segmented-control/segmented-control";
import * as Clipboard from "expo-clipboard";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack } from "tamagui";
import { BuilderView } from "../../components/builder/BuilderView";
import { QueryHeaderActions } from "../../components/query/header-actions";
import { HistorySheet } from "../../components/query/history-sheet";
import { QueryError } from "../../components/query/query-error";
import { QueryPlaceholder } from "../../components/query/query-placeholder";
import { QueryToolbar } from "../../components/query/query-toolbar";
import { SaveSnippetDialog, SnippetsSheet } from "../../components/query/snippets-sheet";
import { SqlEditor } from "../../components/query/sql-editor";
import { TablesPanel, useSchemaBrowser } from "../../components/query/tables-panel";
import { TransactionBanner } from "../../components/query/transaction-banner";
import { useQueryRunner } from "../../components/query/use-query-runner";
import { ResultsView } from "../../components/results/ResultsView";
import { Button, EmptyState } from "../../components/ui";
import { useTheme } from "../../hooks/useTheme";
import { useHaptic } from "../../lib/haptics";
import { type EditorMode, getEditorMode, setEditorMode } from "../../lib/storage/results-prefs";
import type { QueryResult } from "../../lib/types";
import { useConnectionStore } from "../../stores/connection";
import { useSettingsStore } from "../../stores/settings";

const MODES: EditorMode[] = ["editor", "builder"];

const showAlert = (title: string, message: string) => Alert.alert(title, message);

/** Tabs and line breaks inside a value would split the TSV grid, so they become spaces. */
const tsvCell = (val: unknown) => {
  if (val === null || val === undefined) return "";
  const text = typeof val === "object" ? JSON.stringify(val) : String(val);
  return text.replace(/\t/g, " ").replace(/\r?\n/g, " ");
};

const resultsAsTsv = (result: QueryResult) => {
  const header = result.columns.map((c) => tsvCell(c.name)).join("\t");
  const rows = result.rows
    .map((row) => result.columns.map((c) => tsvCell(row[c.name])).join("\t"))
    .join("\n");
  return `${header}\n${rows}`;
};

/**
 * Query screen: SQL editor (or visual builder), schema browser, transaction
 * controls and results for one active connection.
 */
export default function QueryScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const haptic = useHaptic();
  const settings = useSettingsStore((state) => state.settings);
  const { connectionId } = useLocalSearchParams<{ connectionId: string }>();
  const connection = useConnectionStore((state) =>
    connectionId ? state.activeConnections.get(connectionId) : undefined,
  );

  const [query, setQuery] = useState("");
  const [editorMode, setEditorModeState] = useState<EditorMode>("editor");
  const [showTables, setShowTables] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [snippetsOpen, setSnippetsOpen] = useState(false);
  const [saveSnippetOpen, setSaveSnippetOpen] = useState(false);

  const runner = useQueryRunner(connectionId, connection?.config, showAlert);
  const { transaction } = runner;

  const connect = useConnectionStore((state) => state.connect);
  const [reconnecting, setReconnecting] = useState(false);
  const reconnect = useCallback(async () => {
    if (!connection) return;
    setReconnecting(true);
    try {
      await connect(connection.config);
      haptic.success();
    } catch (err) {
      haptic.error();
      showAlert("Couldn’t Reconnect", err instanceof Error ? err.message : String(err));
    } finally {
      setReconnecting(false);
    }
  }, [connect, connection, haptic]);

  // Only a connected instance is handed to the schema browser and Builder.
  // While reconnecting, the new instance exists but isn't logged in yet, and
  // describing tables on it would fail (and used to abort the reconnect).
  const instance = connection?.state.status === "connected" ? connection.instance : undefined;
  const type = connection?.config.type;
  const schemaSource = useMemo(
    () => (instance && type && connectionId ? { id: connectionId, instance, type } : null),
    [instance, type, connectionId],
  );
  const schema = useSchemaBrowser(schemaSource, showAlert);

  useEffect(() => {
    if (!connectionId) return;
    let cancelled = false;
    getEditorMode(connectionId).then((mode) => {
      if (!cancelled && mode) setEditorModeState(mode);
    });
    return () => {
      cancelled = true;
    };
  }, [connectionId]);

  const handleEditorModeChange = useCallback(
    (next: EditorMode) => {
      if (!connectionId) return;
      setEditorModeState(next);
      setEditorMode(connectionId, next).catch(() => {});
    },
    [connectionId],
  );

  const toggleTables = () => {
    if (!showTables) schema.loadTables();
    setShowTables(!showTables);
  };

  const insertIntoQuery = useCallback((text: string) => {
    setQuery((prev) => `${prev}${text} `);
  }, []);

  const handleSaveSnippet = useCallback(() => {
    if (!query.trim()) {
      showAlert("Empty Query", "Type a query before saving it as a snippet.");
      return;
    }
    setSaveSnippetOpen(true);
  }, [query]);

  const copyAllResults = async () => {
    if (!runner.result) return;
    await Clipboard.setStringAsync(resultsAsTsv(runner.result));
    haptic.light();
    showAlert("Copied", "Results copied to the clipboard.");
  };

  const runQuery = () => runner.execute(query);

  const headerRight = useCallback(
    () => (
      <QueryHeaderActions
        onHistory={() => setHistoryOpen(true)}
        onSnippets={() => setSnippetsOpen(true)}
        onSaveSnippet={handleSaveSnippet}
      />
    ),
    [handleSaveSnippet],
  );

  if (!connection) {
    return (
      <>
        <Stack.Screen options={{ title: "Query" }} />
        <YStack flex={1} justifyContent="center" paddingBottom="$xxl">
          <EmptyState
            title="Not Connected"
            message="This connection isn’t open. Connect to it to run queries."
            action={
              connectionId ? (
                <Button onPress={() => router.replace(`/connection/${connectionId}`)}>
                  Open Connection
                </Button>
              ) : undefined
            }
          />
        </YStack>
      </>
    );
  }

  // "connecting" counts too, so the block (with "Reconnecting…") stays up
  // while Reconnect runs instead of vanishing the moment it starts.
  const connectionLost = connection.state.status !== "connected";
  const idle = !runner.result && !runner.error && !runner.executing && !connectionLost;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Stack.Screen options={{ title: connection.config.name || "Query", headerRight }} />

      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, gap: 12 }}>
        <SegmentedControl
          values={["SQL", "Builder"]}
          selectedIndex={MODES.indexOf(editorMode)}
          onChange={(event) =>
            handleEditorModeChange(MODES[event.nativeEvent.selectedSegmentIndex] ?? "editor")
          }
          appearance={theme.mode}
          accessibilityLabel="Editor mode"
        />

        {editorMode === "editor" ? (
          <SqlEditor
            value={query}
            onChangeText={setQuery}
            placeholder="Type a query…"
            enableAutocomplete={settings.enableAutocomplete}
            showTemplates={settings.showSqlTemplates}
            showQuickActions={settings.showQuickActions}
          />
        ) : connectionId && instance ? (
          <YStack
            height={380}
            padding={12}
            backgroundColor="$surface"
            borderRadius="$md"
            style={{ borderCurve: "continuous" }}
          >
            <BuilderView
              connectionId={connectionId}
              type={connection.config.type}
              instance={instance}
              onQueryChange={setQuery}
            />
          </YStack>
        ) : null}

        <QueryToolbar
          tablesOpen={showTables}
          onToggleTables={toggleTables}
          transaction={
            transaction.active
              ? { secondsLeft: transaction.secondsLeft, onPress: transaction.showBanner }
              : null
          }
          executing={runner.executing}
          onRun={runQuery}
        />
      </View>

      <View
        style={{
          flex: 1,
          paddingHorizontal: 16,
          paddingBottom: Math.max(insets.bottom, 16),
          gap: 16,
        }}
      >
        {showTables ? <TablesPanel {...schema} onInsert={insertIntoQuery} /> : null}

        {transaction.bannerVisible ? (
          <TransactionBanner
            secondsLeft={transaction.secondsLeft}
            busy={runner.executing}
            onCommit={transaction.commit}
            onRollback={transaction.rollback}
            onHide={transaction.hideBanner}
          />
        ) : null}

        {connectionLost ? (
          <QueryError
            title="Connection Lost"
            message={connection.state.error ?? "The connection to the server was lost."}
            actionLabel="Reconnect"
            busyLabel="Reconnecting…"
            retrying={reconnecting}
            onRetry={reconnect}
          />
        ) : runner.error ? (
          <QueryError message={runner.error} retrying={runner.executing} onRetry={runQuery} />
        ) : null}

        {runner.result && connectionId ? (
          <ResultsView
            result={runner.result}
            connectionId={connectionId}
            query={runner.executedQuery}
            onCopyAll={copyAllResults}
          />
        ) : null}

        {idle ? <QueryPlaceholder type={connection.config.type} onPick={setQuery} /> : null}
      </View>

      <HistorySheet open={historyOpen} onOpenChange={setHistoryOpen} onSelect={setQuery} />
      <SnippetsSheet open={snippetsOpen} onOpenChange={setSnippetsOpen} onSelect={setQuery} />
      <SaveSnippetDialog open={saveSnippetOpen} onOpenChange={setSaveSnippetOpen} query={query} />
    </View>
  );
}
