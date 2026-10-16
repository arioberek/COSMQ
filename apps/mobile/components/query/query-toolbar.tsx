import { memo } from "react";
import { XStack } from "tamagui";
import { formatCountdown } from "../../lib/sql/transactions";
import { RunButton } from "../run-button";
import { Chip } from "./chip";

type QueryToolbarProps = {
  tablesOpen: boolean;
  onToggleTables: () => void;
  /** Present while a transaction is open; null countdown means manual mode. */
  transaction: { secondsLeft: number | null; onPress: () => void } | null;
  executing: boolean;
  onRun: () => void;
};

/** Row under the editor: Tables toggle and transaction chip on the left, Run on the right. */
export const QueryToolbar = memo(function QueryToolbar({
  tablesOpen,
  onToggleTables,
  transaction,
  executing,
  onRun,
}: QueryToolbarProps) {
  return (
    <XStack alignItems="center" justifyContent="space-between" gap="$sm">
      <XStack alignItems="center" gap="$sm" flexShrink={1}>
        <Chip
          label="Tables"
          icon="grid-outline"
          tone={tablesOpen ? "selected" : "default"}
          onPress={onToggleTables}
          accessibilityLabel={tablesOpen ? "Hide tables" : "Show tables"}
        />
        {transaction ? (
          <Chip
            label={
              transaction.secondsLeft !== null
                ? formatCountdown(transaction.secondsLeft)
                : "Transaction"
            }
            icon="time-outline"
            tone="warning"
            onPress={transaction.onPress}
            accessibilityLabel="Show open transaction"
          />
        ) : null}
      </XStack>
      <RunButton executing={executing} onPress={onRun} disabled={executing} />
    </XStack>
  );
});
