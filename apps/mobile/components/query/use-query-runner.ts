import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import { useHaptic } from "../../lib/haptics";
import { normalizeAutoRollbackSeconds } from "../../lib/settings";
import {
  findDangerousKeyword,
  getTransactionStatements,
  type TransactionStatements,
} from "../../lib/sql/transactions";
import { addToQueryHistory } from "../../lib/storage/query-history";
import type { ConnectionConfig, QueryResult } from "../../lib/types";
import { useConnectionStore } from "../../stores/connection";
import { useSettingsStore } from "../../stores/settings";

type DangerousAction = "cancel" | "wrap" | "run";

/** Native confirm for data-modifying statements; resolves with the user's choice. */
const confirmDangerous = (keyword: string) =>
  new Promise<DangerousAction>((resolve) => {
    Alert.alert(
      `Run ${keyword}?`,
      "This statement may modify or destroy data. Wrapping it in a transaction lets you roll back if it goes wrong.",
      [
        { text: "Wrap in Transaction", onPress: () => resolve("wrap") },
        { text: "Run Anyway", style: "destructive", onPress: () => resolve("run") },
        { text: "Cancel", style: "cancel", onPress: () => resolve("cancel") },
      ],
      { cancelable: true, onDismiss: () => resolve("cancel") },
    );
  });

type TransactionState = { active: boolean; statements: TransactionStatements | null };

/**
 * Runs queries for one connection: plain execution with history, the
 * dangerous-statement confirm, wrapping in a transaction, commit/rollback and
 * the settings-driven auto-rollback countdown.
 */
export function useQueryRunner(
  connectionId: string | undefined,
  config: ConnectionConfig | undefined,
  showAlert: (title: string, message: string) => void,
) {
  const haptic = useHaptic();
  const settings = useSettingsStore((state) => state.settings);
  const executeQuery = useConnectionStore((state) => state.executeQuery);

  const [result, setResult] = useState<QueryResult | null>(null);
  // The SQL that produced `result`, so ResultsView's prefs key stays stable
  // while the editor buffer changes after a run.
  const [executedQuery, setExecutedQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [transactionState, setTransactionState] = useState<TransactionState>({
    active: false,
    statements: null,
  });
  const [transactionDeadline, setTransactionDeadline] = useState<number | null>(null);
  const [transactionTimeLeft, setTransactionTimeLeft] = useState(0);
  const [bannerVisible, setBannerVisible] = useState(true);
  const autoRollbackTriggered = useRef(false);
  // True while the dangerous-statement confirm is up; the countdown pauses.
  const confirming = useRef(false);
  // Latest transaction, for the unmount cleanup below.
  const transactionRef = useRef(transactionState);
  transactionRef.current = transactionState;

  // Leaving the screen with a transaction open would leave the session inside
  // BEGIN with its locks held and no banner to finish it. Roll it back.
  useEffect(() => {
    return () => {
      const current = transactionRef.current;
      if (current.active && current.statements && connectionId) {
        executeQuery(connectionId, current.statements.rollback).catch(() => {});
      }
    };
  }, [connectionId, executeQuery]);

  const finalizeTransaction = useCallback(
    async (action: "commit" | "rollback", auto = false) => {
      if (!transactionState.active || !transactionState.statements || !connectionId) return;

      setExecuting(true);
      if (!auto) setError(null);

      try {
        const outcome = await executeQuery(
          connectionId,
          action === "commit"
            ? transactionState.statements.commit
            : transactionState.statements.rollback,
        );
        setTransactionState({ active: false, statements: null });
        setTransactionDeadline(null);
        setTransactionTimeLeft(0);
        setBannerVisible(false);
        // PostgreSQL answers COMMIT with "ROLLBACK" when an earlier statement
        // failed inside the transaction: nothing was committed.
        const rolledBackInstead =
          action === "commit" && /^ROLLBACK/i.test(outcome.command?.trim() ?? "");
        if (rolledBackInstead) {
          haptic.error();
          setError(
            "An earlier statement failed inside the transaction, so the database rolled it back instead of committing.",
          );
        } else if (action === "commit") {
          haptic.success();
        } else {
          haptic.warning();
        }
      } catch (err) {
        haptic.error();
        setError(err instanceof Error ? err.message : "Transaction failed");
      } finally {
        setExecuting(false);
      }
    },
    [connectionId, executeQuery, haptic, transactionState.active, transactionState.statements],
  );

  const executeWithTransaction = async (sql: string) => {
    if (!connectionId || !config) return;
    const transaction = getTransactionStatements(config.type);
    if (!transaction) {
      showAlert(
        "Transactions Unavailable",
        "Transactions aren’t supported for this connection type.",
      );
      return;
    }
    if (transactionState.active) {
      showAlert("Transaction in Progress", "Commit or roll back the current transaction first.");
      return;
    }

    setExecuting(true);
    setError(null);
    setResult(null);

    try {
      const autoRollbackSeconds = settings.autoRollbackEnabled
        ? normalizeAutoRollbackSeconds(settings.autoRollbackSeconds)
        : null;
      await executeQuery(connectionId, transaction.begin);
      const queryResult = await executeQuery(connectionId, sql);
      setResult(queryResult);
      setExecutedQuery(sql);
      setTransactionState({ active: true, statements: transaction });
      if (autoRollbackSeconds) {
        setTransactionDeadline(Date.now() + autoRollbackSeconds * 1000);
        setTransactionTimeLeft(autoRollbackSeconds);
      } else {
        setTransactionDeadline(null);
        setTransactionTimeLeft(0);
      }
      setBannerVisible(true);
      autoRollbackTriggered.current = false;
    } catch (err) {
      try {
        await executeQuery(connectionId, transaction.rollback);
      } catch {}
      setError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setExecuting(false);
    }
  };

  // Countdown tick; rolls back automatically when it reaches zero.
  useEffect(() => {
    if (!transactionState.active || !transactionDeadline || !settings.autoRollbackEnabled) {
      setTransactionTimeLeft(0);
      autoRollbackTriggered.current = false;
      return;
    }

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((transactionDeadline - Date.now()) / 1000));
      setTransactionTimeLeft(remaining);
      if (remaining <= 0 && !autoRollbackTriggered.current && !executing && !confirming.current) {
        autoRollbackTriggered.current = true;
        finalizeTransaction("rollback", true);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [
    transactionState.active,
    transactionDeadline,
    executing,
    finalizeTransaction,
    settings.autoRollbackEnabled,
  ]);

  // Restart (or cancel) the countdown when the auto-rollback settings change.
  useEffect(() => {
    if (!transactionState.active) return;

    if (!settings.autoRollbackEnabled) {
      setTransactionDeadline(null);
      setTransactionTimeLeft(0);
      autoRollbackTriggered.current = false;
      return;
    }

    const normalized = normalizeAutoRollbackSeconds(settings.autoRollbackSeconds);
    setTransactionDeadline(Date.now() + normalized * 1000);
    setTransactionTimeLeft(normalized);
    autoRollbackTriggered.current = false;
  }, [transactionState.active, settings.autoRollbackEnabled, settings.autoRollbackSeconds]);

  const execute = async (query: string) => {
    const trimmed = query.trim();
    if (!connectionId || !trimmed) return;

    if (settings.dangerousOpsHint) {
      const dangerousKeyword = findDangerousKeyword(trimmed, config?.type);
      if (dangerousKeyword) {
        // Pause the auto-rollback countdown while the alert is up, otherwise it
        // can roll back underneath the alert and "Run Anyway" then commits
        // outside any transaction.
        confirming.current = true;
        const confirmStarted = Date.now();
        let action: DangerousAction;
        try {
          action = await confirmDangerous(dangerousKeyword);
        } finally {
          confirming.current = false;
        }
        const pausedFor = Date.now() - confirmStarted;
        setTransactionDeadline((deadline) => (deadline === null ? null : deadline + pausedFor));
        if (action === "cancel") return;
        if (action === "wrap") {
          await executeWithTransaction(trimmed);
          return;
        }
      }
    }

    setExecuting(true);
    setError(null);
    setResult(null);

    try {
      const queryResult = await executeQuery(connectionId, trimmed);
      setResult(queryResult);
      setExecutedQuery(trimmed);
      haptic.success();
      addToQueryHistory({
        query: trimmed,
        connectionId,
        connectionName: config?.name ?? "Unknown",
      });
    } catch (err) {
      haptic.error();
      setError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setExecuting(false);
    }
  };

  const showCountdown = settings.autoRollbackEnabled && transactionDeadline !== null;

  return {
    result,
    executedQuery,
    error,
    executing,
    execute,
    transaction: {
      active: transactionState.active,
      /** Seconds until auto-rollback, or null when there's no countdown. */
      secondsLeft: showCountdown ? transactionTimeLeft : null,
      bannerVisible: transactionState.active && bannerVisible,
      showBanner: () => setBannerVisible(true),
      hideBanner: () => setBannerVisible(false),
      commit: () => finalizeTransaction("commit"),
      rollback: () => finalizeTransaction("rollback"),
    },
  };
}
