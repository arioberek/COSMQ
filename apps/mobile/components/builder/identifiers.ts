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

export const quoteQualified = (
  name: string,
  type: DatabaseType,
  schema?: string,
): string => {
  if (schema && schema !== "public") {
    return `${quoteIdent(schema, type)}.${quoteIdent(name, type)}`;
  }
  return quoteIdent(name, type);
};

export type LiteralKind = "string" | "number" | "boolean" | "null";

export const inferLiteralKind = (raw: string): LiteralKind => {
  const trimmed = raw.trim();
  if (trimmed === "" || trimmed.toLowerCase() === "null") return "null";
  if (trimmed.toLowerCase() === "true" || trimmed.toLowerCase() === "false") return "boolean";
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return "number";
  return "string";
};

const escapeStringLiteral = (raw: string): string => raw.replace(/'/g, "''");

export const formatSqlLiteral = (raw: string, type: DatabaseType): string => {
  const kind = inferLiteralKind(raw);
  switch (kind) {
    case "null":
      return "NULL";
    case "number":
      return raw.trim();
    case "boolean": {
      const truthy = raw.trim().toLowerCase() === "true";
      // MySQL/MariaDB and SQLite accept TRUE/FALSE in modern versions; fall through
      if (type === "mysql" || type === "mariadb" || type === "sqlite") {
        return truthy ? "1" : "0";
      }
      return truthy ? "TRUE" : "FALSE";
    }
    case "string":
      return `'${escapeStringLiteral(raw)}'`;
  }
};

export const splitListLiteral = (raw: string): string[] =>
  raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
