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
const DANGEROUS_PATTERN = new RegExp(`\\b(${DANGEROUS_KEYWORDS.join("|")})\\b`, "g");

/** MongoDB database commands that modify or destroy data. */
const DANGEROUS_MONGO_COMMANDS = new Set([
  "update",
  "delete",
  "drop",
  "dropDatabase",
  "dropIndexes",
  "findAndModify",
  "renameCollection",
  "bulkWrite",
  "dropUser",
  "dropAllUsersFromDatabase",
  "dropRole",
]);

/** An aggregate whose pipeline writes a collection ($out replaces it, $merge upserts into it). */
const aggregateWrites = (command: Record<string, unknown>): string | null => {
  const pipeline = command.pipeline;
  if (!Array.isArray(pipeline)) return null;
  for (const stage of pipeline) {
    if (stage && typeof stage === "object") {
      if ("$out" in stage) return "aggregate $out";
      if ("$merge" in stage) return "aggregate $merge";
    }
  }
  return null;
};

/** Removes comments and string/identifier literals so keyword checks see only SQL. */
const stripSql = (sql: string): string =>
  sql
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--.*$/gm, " ")
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/`(?:[^`\\]|\\.)*`/g, "``")
    .replace(/\s+/g, " ");

/** The command name of a MongoDB JSON command: its first key. */
const findDangerousMongoCommand = (query: string): string | null => {
  try {
    const parsed: unknown = JSON.parse(query);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const command = Object.keys(parsed)[0];
    if (command === "aggregate") return aggregateWrites(parsed as Record<string, unknown>);
    return command && DANGEROUS_MONGO_COMMANDS.has(command) ? command : null;
  } catch {
    return null;
  }
};

/**
 * The first data-modifying keyword in the statement, if any.
 * `REPLACE(...)` the function and `SELECT ... FOR UPDATE` are reads and are skipped.
 * MongoDB queries are JSON commands, so they're checked by command name instead.
 */
export const findDangerousKeyword = (sql: string, type?: DatabaseType): string | null => {
  if (type === "mongodb") return findDangerousMongoCommand(sql.trim());

  const normalized = stripSql(sql).toUpperCase();
  DANGEROUS_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null = DANGEROUS_PATTERN.exec(normalized);
  while (match) {
    const keyword = match[1];
    const before = normalized.slice(0, match.index).trimEnd();
    const after = normalized.slice(match.index + keyword.length).trimStart();
    const isReplaceFunction = keyword === "REPLACE" && after.startsWith("(");
    // FOR UPDATE / FOR NO KEY UPDATE are row locks on a read.
    const isRowLock = keyword === "UPDATE" && /\bFOR( NO KEY)?$/.test(before);
    if (!isReplaceFunction && !isRowLock) return keyword;
    match = DANGEROUS_PATTERN.exec(normalized);
  }
  return null;
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
