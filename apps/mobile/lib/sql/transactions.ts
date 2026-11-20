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

/** How a dialect lexes comments and quoted text. They differ enough to hide a statement. */
type LexProfile = {
  /** Backslash escapes a quote inside strings (MySQL, MariaDB). */
  backslashEscapes: boolean;
  /** `$tag$ ... $tag$` quoting (PostgreSQL, CockroachDB). */
  dollarQuotes: boolean;
  /** `#` starts a line comment (MySQL, MariaDB). */
  hashComments: boolean;
  /** `--` only starts a comment when whitespace follows (MySQL, MariaDB). */
  dashNeedsSpace: boolean;
  /** Backticks quote identifiers (MySQL, MariaDB, SQLite). */
  backtickQuotes: boolean;
};

const POSTGRES_LEX: LexProfile = {
  backslashEscapes: false,
  dollarQuotes: true,
  hashComments: false,
  dashNeedsSpace: false,
  backtickQuotes: false,
};
const MYSQL_LEX: LexProfile = {
  backslashEscapes: true,
  dollarQuotes: false,
  hashComments: true,
  dashNeedsSpace: true,
  backtickQuotes: true,
};
const SQLITE_LEX: LexProfile = {
  backslashEscapes: false,
  dollarQuotes: false,
  hashComments: false,
  dashNeedsSpace: false,
  backtickQuotes: true,
};

/** The profiles to check: one for a known dialect, all of them when it is unknown. */
const lexProfilesFor = (type?: DatabaseType): LexProfile[] => {
  switch (type) {
    case "postgres":
    case "cockroachdb":
      return [POSTGRES_LEX];
    case "mysql":
    case "mariadb":
      return [MYSQL_LEX];
    case "sqlite":
      return [SQLITE_LEX];
    default:
      return [POSTGRES_LEX, MYSQL_LEX, SQLITE_LEX];
  }
};

const DOLLAR_TAG = /^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/;
const IDENTIFIER_CHAR = /[A-Za-z0-9_$]/;

/**
 * Removes comments and string/identifier literals so keyword checks see only SQL.
 *
 * One left-to-right pass, because the constructs nest: a comment marker inside a
 * string is text, and a quote inside a comment is not a string. Where a construct
 * may run as SQL it stays visible: MySQL executable comments and the bodies of
 * dollar-quoted blocks (`DO $$ ... $$`).
 */
const stripSql = (sql: string, lex: LexProfile): string => {
  let out = "";
  let i = 0;
  const length = sql.length;

  /** Skips a quoted run starting at `i` (the opening quote) and returns the index after it. */
  const skipQuoted = (quote: string, backslash: boolean): number => {
    let j = i + 1;
    while (j < length) {
      const ch = sql[j];
      if (backslash && ch === "\\") {
        j += 2;
        continue;
      }
      if (ch === quote) {
        // A doubled quote is an escaped quote, not the end.
        if (sql[j + 1] === quote) {
          j += 2;
          continue;
        }
        return j + 1;
      }
      j += 1;
    }
    return length;
  };

  while (i < length) {
    const ch = sql[i];
    const next = sql[i + 1];

    if (ch === "-" && next === "-") {
      const after = sql[i + 2];
      if (!lex.dashNeedsSpace || after === undefined || /\s/.test(after)) {
        const end = sql.indexOf("\n", i);
        i = end === -1 ? length : end;
        out += " ";
        continue;
      }
    }

    if (ch === "#" && lex.hashComments) {
      const end = sql.indexOf("\n", i);
      i = end === -1 ? length : end;
      out += " ";
      continue;
    }

    if (ch === "/" && next === "*") {
      // `/*! ... */` and `/*M! ... */` run as SQL on MySQL and MariaDB: keep the body.
      const executable = /^\/\*M?!\d*/.exec(sql.slice(i, i + 12));
      if (executable) {
        i += executable[0].length;
        out += " ";
        continue;
      }
      // Not nested, even on PostgreSQL: ending at the first `*/` only reveals more text.
      const end = sql.indexOf("*/", i + 2);
      i = end === -1 ? length : end + 2;
      out += " ";
      continue;
    }

    // The closing marker of an executable comment whose body was kept.
    if (ch === "*" && next === "/") {
      i += 2;
      out += " ";
      continue;
    }

    if (ch === "'") {
      // PostgreSQL `E'...'` strings take backslash escapes.
      const prev = sql[i - 1];
      const beforePrev = sql[i - 2];
      const isEscapeString =
        (prev === "E" || prev === "e") &&
        (beforePrev === undefined || !IDENTIFIER_CHAR.test(beforePrev));
      i = skipQuoted("'", lex.backslashEscapes || isEscapeString);
      out += "''";
      continue;
    }

    if (ch === '"') {
      i = skipQuoted('"', lex.backslashEscapes);
      out += '""';
      continue;
    }

    if (ch === "`" && lex.backtickQuotes) {
      i = skipQuoted("`", false);
      out += "``";
      continue;
    }

    if (ch === "$" && lex.dollarQuotes) {
      const prev = sql[i - 1];
      const tag =
        prev === undefined || !IDENTIFIER_CHAR.test(prev) ? DOLLAR_TAG.exec(sql.slice(i)) : null;
      if (tag) {
        // The body may be a DO block or function that runs, so it stays visible.
        // It is copied as-is: quotes and comment markers inside it are plain text.
        const bodyStart = i + tag[0].length;
        const close = sql.indexOf(tag[0], bodyStart);
        const bodyEnd = close === -1 ? length : close;
        out += ` ${sql.slice(bodyStart, bodyEnd)} `;
        i = close === -1 ? length : close + tag[0].length;
        continue;
      }
    }

    out += ch;
    i += 1;
  }

  return out.replace(/\s+/g, " ");
};

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

  for (const lex of lexProfilesFor(type)) {
    const keyword = findKeywordIn(stripSql(sql, lex).toUpperCase());
    if (keyword) return keyword;
  }
  return null;
};

const findKeywordIn = (normalized: string): string | null => {
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
