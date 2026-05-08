import type { DatabaseType } from "../../lib/types";
import {
  formatSqlLiteral,
  inferLiteralKind,
  quoteIdent,
  quoteQualified,
  splitListLiteral,
} from "./identifiers";

// ── SQL ─────────────────────────────────────────────────────────────────────

export type SqlOperator =
  | "="
  | "!="
  | ">"
  | "<"
  | ">="
  | "<="
  | "LIKE"
  | "NOT LIKE"
  | "IN"
  | "NOT IN"
  | "BETWEEN"
  | "IS NULL"
  | "IS NOT NULL";

export type SqlCombinator = "AND" | "OR";

export interface SqlCondition {
  id: string;
  combinator: SqlCombinator;
  column: string;
  operator: SqlOperator;
  value: string;
}

export interface SqlSort {
  id: string;
  column: string;
  dir: "ASC" | "DESC";
}

export interface SqlBuilderState {
  table: { schema?: string; name: string } | null;
  columns: string[]; // empty → SELECT *
  conditions: SqlCondition[];
  sort: SqlSort[];
  limit: number | null;
}

export const emptySqlBuilderState = (): SqlBuilderState => ({
  table: null,
  columns: [],
  conditions: [],
  sort: [],
  limit: 100,
});

const SQL_OPERATORS_NO_VALUE: ReadonlySet<SqlOperator> = new Set(["IS NULL", "IS NOT NULL"]);

export const SQL_OPERATORS: SqlOperator[] = [
  "=",
  "!=",
  ">",
  "<",
  ">=",
  "<=",
  "LIKE",
  "NOT LIKE",
  "IN",
  "NOT IN",
  "BETWEEN",
  "IS NULL",
  "IS NOT NULL",
];

const renderSqlCondition = (cond: SqlCondition, type: DatabaseType): string | null => {
  if (!cond.column) return null;
  const col = quoteIdent(cond.column, type);

  if (SQL_OPERATORS_NO_VALUE.has(cond.operator)) {
    return `${col} ${cond.operator}`;
  }

  if (cond.operator === "IN" || cond.operator === "NOT IN") {
    const items = splitListLiteral(cond.value);
    if (items.length === 0) return null;
    const list = items.map((v) => formatSqlLiteral(v, type)).join(", ");
    return `${col} ${cond.operator} (${list})`;
  }

  if (cond.operator === "BETWEEN") {
    const items = splitListLiteral(cond.value);
    if (items.length !== 2) return null;
    return `${col} BETWEEN ${formatSqlLiteral(items[0], type)} AND ${formatSqlLiteral(items[1], type)}`;
  }

  if (cond.operator === "LIKE" || cond.operator === "NOT LIKE") {
    return `${col} ${cond.operator} ${formatSqlLiteral(cond.value, type)}`;
  }

  return `${col} ${cond.operator} ${formatSqlLiteral(cond.value, type)}`;
};

export const sqlBuilderToString = (state: SqlBuilderState, type: DatabaseType): string => {
  if (!state.table) return "";

  const cols =
    state.columns.length === 0 ? "*" : state.columns.map((c) => quoteIdent(c, type)).join(", ");
  const tableRef = quoteQualified(state.table.name, type, state.table.schema);

  let sql = `SELECT ${cols}\nFROM ${tableRef}`;

  if (state.conditions.length > 0) {
    const parts: string[] = [];
    for (const cond of state.conditions) {
      const rendered = renderSqlCondition(cond, type);
      if (!rendered) continue;
      if (parts.length === 0) {
        parts.push(rendered);
      } else {
        parts.push(`${cond.combinator} ${rendered}`);
      }
    }
    if (parts.length > 0) {
      sql += `\nWHERE ${parts.join("\n  ")}`;
    }
  }

  if (state.sort.length > 0) {
    const ord = state.sort
      .filter((s) => s.column)
      .map((s) => `${quoteIdent(s.column, type)} ${s.dir}`)
      .join(", ");
    if (ord) sql += `\nORDER BY ${ord}`;
  }

  // `LIMIT 0` is valid SQL — emit it verbatim. Only `null` means "no clause".
  if (state.limit !== null && state.limit >= 0) {
    sql += `\nLIMIT ${Math.floor(state.limit)}`;
  }

  return sql;
};

// ── MongoDB ─────────────────────────────────────────────────────────────────

export type MongoOperator =
  | "$eq"
  | "$ne"
  | "$gt"
  | "$lt"
  | "$gte"
  | "$lte"
  | "$in"
  | "$nin"
  | "$exists"
  | "$regex";

export interface MongoFilter {
  id: string;
  field: string;
  operator: MongoOperator;
  value: string;
}

export interface MongoSort {
  id: string;
  field: string;
  dir: 1 | -1;
}

export interface MongoBuilderState {
  collection: string | null;
  filters: MongoFilter[];
  sort: MongoSort[];
  limit: number | null;
  projection: string[]; // empty → no projection
}

export const emptyMongoBuilderState = (): MongoBuilderState => ({
  collection: null,
  filters: [],
  sort: [],
  limit: 50,
  projection: [],
});

export const MONGO_OPERATORS: MongoOperator[] = [
  "$eq",
  "$ne",
  "$gt",
  "$lt",
  "$gte",
  "$lte",
  "$in",
  "$nin",
  "$exists",
  "$regex",
];

const coerceLiteral = (raw: string): unknown => {
  const trimmed = raw.trim();
  const kind = inferLiteralKind(trimmed);
  switch (kind) {
    case "null":
      return null;
    case "number":
      return Number(trimmed);
    case "boolean":
      return trimmed.toLowerCase() === "true";
    case "string":
      return trimmed;
  }
};

// Returns null when the filter should be skipped entirely — e.g. a comparison
// operator with an empty value, which means the user added the filter but
// hasn't typed anything yet.
const buildMongoFilterClause = (filter: MongoFilter): unknown | null => {
  const trimmed = filter.value.trim();
  if (filter.operator === "$exists") {
    return { $exists: trimmed.toLowerCase() !== "false" };
  }
  if (filter.operator === "$regex") {
    if (trimmed === "") return null;
    // Validate the pattern client-side so the user gets immediate feedback
    // instead of a server-side parse error.
    try {
      new RegExp(filter.value);
    } catch {
      return null;
    }
    return { $regex: filter.value };
  }
  if (filter.operator === "$in" || filter.operator === "$nin") {
    const items = splitListLiteral(filter.value).map(coerceLiteral);
    if (items.length === 0) return null;
    return { [filter.operator]: items };
  }
  // Comparison operators ($eq/$ne/$gt/$lt/$gte/$lte): empty input means the
  // user hasn't filled in a value yet, so skip the clause rather than
  // emitting `{ $eq: "" }` and silently changing the result set.
  if (trimmed === "") return null;
  return { [filter.operator]: coerceLiteral(filter.value) };
};

export const mongoBuilderToString = (state: MongoBuilderState): string => {
  if (!state.collection) return "";

  const filterDoc: Record<string, unknown> = {};
  for (const f of state.filters) {
    if (!f.field) continue;
    const clause = buildMongoFilterClause(f);
    if (clause === null) continue;
    if (filterDoc[f.field]) {
      // Merge multiple operators on the same field into one nested doc
      const existing = filterDoc[f.field];
      if (existing && typeof existing === "object" && clause && typeof clause === "object") {
        filterDoc[f.field] = { ...existing, ...clause };
        continue;
      }
    }
    filterDoc[f.field] = clause;
  }

  const sortDoc: Record<string, 1 | -1> = {};
  for (const s of state.sort) {
    if (s.field) sortDoc[s.field] = s.dir;
  }

  const projectionDoc: Record<string, 1> = {};
  for (const name of state.projection) {
    projectionDoc[name] = 1;
  }

  const command: Record<string, unknown> = {
    find: state.collection,
  };
  if (Object.keys(filterDoc).length > 0) command.filter = filterDoc;
  if (Object.keys(sortDoc).length > 0) command.sort = sortDoc;
  if (state.limit !== null && state.limit >= 0) command.limit = Math.floor(state.limit);
  if (Object.keys(projectionDoc).length > 0) command.projection = projectionDoc;

  return JSON.stringify(command, null, 2);
};

// ── Helpers shared by both ──────────────────────────────────────────────────

export const newId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const isSqlType = (type: DatabaseType): boolean => type !== "mongodb";
