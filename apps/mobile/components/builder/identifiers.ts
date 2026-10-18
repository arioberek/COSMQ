import type { DatabaseType } from "../../lib/types";

const SQL_QUOTE: Partial<Record<DatabaseType, [string, string]>> = {
  postgres: ['"', '"'],
  cockroachdb: ['"', '"'],
  sqlite: ['"', '"'],
  mysql: ["`", "`"],
  mariadb: ["`", "`"],
};

const escapeIdentifier = (name: string, close: string): string =>
  name.replace(new RegExp(close.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), close + close);

export const quoteIdent = (name: string, type: DatabaseType): string => {
  const pair = SQL_QUOTE[type];
  if (!pair) return name;
  const [open, close] = pair;
  return `${open}${escapeIdentifier(name, close)}${close}`;
};

export const quoteQualified = (name: string, type: DatabaseType, schema?: string): string => {
  if (!schema) return quoteIdent(name, type);
  // "public" is only the implicit default for Postgres/CockroachDB. For
  // MySQL/MariaDB/SQLite, a database/schema literally named "public" must
  // still appear in the qualified identifier.
  const isPgDefaultSchema = (type === "postgres" || type === "cockroachdb") && schema === "public";
  if (isPgDefaultSchema) return quoteIdent(name, type);
  return `${quoteIdent(schema, type)}.${quoteIdent(name, type)}`;
};

export type LiteralKind = "string" | "number" | "boolean" | "null";

export const inferLiteralKind = (raw: string): LiteralKind => {
  const trimmed = raw.trim();
  // Only the literal "null" (case-insensitive) maps to NULL. An empty input
  // falls through to "string" so users can express `col = ''` via the builder
  // (the dedicated IS NULL / IS NOT NULL operators cover null intent).
  if (trimmed.toLowerCase() === "null") return "null";
  if (trimmed.toLowerCase() === "true" || trimmed.toLowerCase() === "false") return "boolean";
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return "number";
  return "string";
};

const escapeStringLiteral = (raw: string, type: DatabaseType): string => {
  // MySQL/MariaDB treat backslash as an escape character inside '...' strings
  // unless NO_BACKSLASH_ESCAPES is set (it's not by default). Postgres,
  // CockroachDB, and SQLite follow the SQL standard — only `'` doubling needed.
  const needsBackslashEscape = type === "mysql" || type === "mariadb";
  const backslashEscaped = needsBackslashEscape ? raw.replace(/\\/g, "\\\\") : raw;
  return backslashEscaped.replace(/'/g, "''");
};

/** How a column's declared type constrains the literal compared against it. */
export type ColumnValueKind = "text" | "number" | "boolean" | "unknown";

// `\b` after "int" keeps "interval" out.
const NUMBER_COLUMN =
  /^(tiny|small|medium|big)?int(eger|[248])?\b|^(decimal|numeric|real|float|double|money|serial|bigserial|smallserial|number)/;
const BOOLEAN_COLUMN = /^(bool|boolean|bit\(1\)|tinyint\(1\))$/;
// Dates and times compare as quoted strings ('2026-10-18'), just like text.
const TEXT_COLUMN =
  /char|text|string|uuid|citext|name|enum|set\(|date|time|interval|inet|cidr|macaddr|json|xml|blob|binary|bytea/;

export const columnValueKind = (columnType: string | undefined): ColumnValueKind => {
  const t = (columnType ?? "").toLowerCase().trim();
  if (!t) return "unknown";
  if (BOOLEAN_COLUMN.test(t)) return "boolean";
  if (NUMBER_COLUMN.test(t)) return "number";
  if (TEXT_COLUMN.test(t)) return "text";
  return "unknown";
};

/**
 * SQL literal for a value typed into the builder. With the column's declared
 * type, text columns always get a quoted string (`zip = '007'`, not `= 007`,
 * which Postgres rejects and MySQL matches as 7) and number columns only take
 * unquoted digits. Without a type, the literal's own shape decides.
 */
export const formatSqlLiteral = (raw: string, type: DatabaseType, columnType?: string): string => {
  const inferred = inferLiteralKind(raw);
  const columnKind = columnValueKind(columnType);
  const kind: LiteralKind =
    inferred === "null"
      ? "null"
      : columnKind === "text"
        ? "string"
        : columnKind === "number" && inferred !== "number"
          ? "string"
          : columnKind === "boolean" && inferred === "number"
            ? "boolean"
            : inferred;
  switch (kind) {
    case "null":
      return "NULL";
    case "number":
      return raw.trim();
    case "boolean": {
      const lower = raw.trim().toLowerCase();
      const truthy = lower === "true" || (lower !== "false" && Number(lower) !== 0);
      // MySQL/MariaDB and SQLite store booleans as 0/1.
      if (type === "mysql" || type === "mariadb" || type === "sqlite") {
        return truthy ? "1" : "0";
      }
      return truthy ? "TRUE" : "FALSE";
    }
    case "string":
      return `'${escapeStringLiteral(raw, type)}'`;
  }
};

export const splitListLiteral = (raw: string): string[] =>
  raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
