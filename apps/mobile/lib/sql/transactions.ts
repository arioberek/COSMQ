import type { DatabaseType } from "../types";

export type TransactionStatements = {
  begin: string;
  commit: string;
  rollback: string;
};

/** BEGIN/COMMIT/ROLLBACK for the dialect, or null when transactions aren't supported. */
export const getTransactionStatements = (type: DatabaseType): TransactionStatements | null => {
  switch (type) {
    case "postgres":
    case "cockroachdb":
    case "sqlite":
      return { begin: "BEGIN", commit: "COMMIT", rollback: "ROLLBACK" };
    case "mysql":
    case "mariadb":
      return { begin: "START TRANSACTION", commit: "COMMIT", rollback: "ROLLBACK" };
    case "mongodb":
      return null;
  }
};

const DANGEROUS_KEYWORDS = ["UPDATE", "DELETE", "DROP", "TRUNCATE", "ALTER", "MERGE", "REPLACE"];

/** Removes comments and string/identifier literals so keyword checks see only SQL. */
const stripSql = (sql: string): string =>
  sql
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--.*$/gm, " ")
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/\s+/g, " ");

/** The first data-modifying keyword in the statement, if any. */
export const findDangerousKeyword = (sql: string): string | null => {
  const normalized = stripSql(sql).toUpperCase();
  const match = normalized.match(new RegExp(`\\b(${DANGEROUS_KEYWORDS.join("|")})\\b`));
  return match ? match[1] : null;
};

/** "0:45" for a minute or more, "12s" below. */
export const formatCountdown = (seconds: number): string => {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const remaining = safe % 60;
  if (minutes > 0) {
    return `${minutes}:${remaining.toString().padStart(2, "0")}`;
  }
  return `${remaining}s`;
};
