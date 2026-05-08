import type { ColumnInfo } from "../../lib/types";
import {
  isBooleanType,
  isDateType,
  isJsonType,
  isNullish,
  isNumericType,
  isTextType,
} from "./format";

type Row = Record<string, unknown>;

const SHORT_STRING_MAX = 32;

const isLikelyPkName = (name: string): boolean => {
  const n = name.toLowerCase();
  if (n === "_id" || n === "id" || n === "uuid") return true;
  return false;
};

const isPkSuffix = (name: string): boolean => name.toLowerCase().endsWith("_id");

const sampleStringLength = (col: string, rows: Row[]): number => {
  let max = 0;
  for (let i = 0; i < Math.min(rows.length, 25); i++) {
    const v = rows[i]?.[col];
    if (typeof v === "string") max = Math.max(max, v.length);
    else if (!isNullish(v)) max = Math.max(max, String(v).length);
  }
  return max;
};

const isShortStringColumn = (col: ColumnInfo, rows: Row[]): boolean => {
  if (!isTextType(col.type)) return false;
  const len = sampleStringLength(col.name, rows);
  return len > 0 && len <= SHORT_STRING_MAX;
};

const isLongTextColumn = (col: ColumnInfo, rows: Row[]): boolean => {
  if (!isTextType(col.type)) return false;
  return sampleStringLength(col.name, rows) > SHORT_STRING_MAX;
};

const firstNonNull = (col: string, rows: Row[]): unknown => {
  for (const row of rows) {
    if (!isNullish(row[col])) return row[col];
  }
  return null;
};

export const detectPrimaryKey = (
  columns: ColumnInfo[],
  rows: Row[],
): ColumnInfo | null => {
  if (columns.length === 0) return null;
  const exact = columns.find((c) => isLikelyPkName(c.name));
  if (exact) return exact;
  const suffix = columns.find((c) => isPkSuffix(c.name));
  if (suffix) return suffix;
  // Fall back to first non-null short-string-ish column
  for (const col of columns) {
    const v = firstNonNull(col.name, rows);
    if (!isNullish(v)) {
      const s = typeof v === "string" ? v : String(v);
      if (s.length <= SHORT_STRING_MAX) return col;
    }
  }
  return columns[0] ?? null;
};

type Tier = 1 | 2 | 3 | 4 | 5;

const columnTier = (col: ColumnInfo, rows: Row[], pkName: string | null): Tier => {
  if (pkName && col.name === pkName) return 1;
  if (isLongTextColumn(col, rows) || isJsonType(col.type)) return 5;
  if (isShortStringColumn(col, rows)) return 2;
  if (isNumericType(col.type)) return 3;
  if (isDateType(col.type)) return 3;
  if (isBooleanType(col.type)) return 4;
  // Unknown: peek at sample
  const v = firstNonNull(col.name, rows);
  if (typeof v === "string") {
    return v.length <= SHORT_STRING_MAX ? 2 : 5;
  }
  if (typeof v === "number") return 3;
  if (typeof v === "boolean") return 4;
  if (typeof v === "object" && v !== null) return 5;
  return 4;
};

export interface OrderedColumns {
  primary: ColumnInfo | null;
  ordered: ColumnInfo[];
}

export const orderColumnsByPriority = (
  columns: ColumnInfo[],
  rows: Row[],
): OrderedColumns => {
  const primary = detectPrimaryKey(columns, rows);
  const pkName = primary?.name ?? null;
  const ordered = [...columns]
    .map((c, i) => ({ c, i, tier: columnTier(c, rows, pkName) }))
    .sort((a, b) => a.tier - b.tier || a.i - b.i)
    .map((entry) => entry.c);
  return { primary, ordered };
};

export interface ResolvedColumns {
  primary: ColumnInfo | null;
  visible: ColumnInfo[];
  hidden: ColumnInfo[];
  preview: ColumnInfo[];
  rest: ColumnInfo[];
}

export const resolveColumns = (
  columns: ColumnInfo[],
  rows: Row[],
  pinned: string[],
  hidden: string[],
  previewCount = 3,
): ResolvedColumns => {
  const { primary, ordered } = orderColumnsByPriority(columns, rows);
  const hiddenSet = new Set(hidden);
  const pinnedSet = new Set(pinned);

  const visible = ordered.filter((c) => !hiddenSet.has(c.name));
  const hiddenCols = ordered.filter((c) => hiddenSet.has(c.name));

  const pinnedFirst: ColumnInfo[] = [];
  const others: ColumnInfo[] = [];
  for (const col of visible) {
    if (pinnedSet.has(col.name)) pinnedFirst.push(col);
    else others.push(col);
  }
  const finalVisible = [...pinnedFirst, ...others];

  // Preview = primary chip column + next N visible columns (excluding primary).
  const previewExcludingPk = finalVisible.filter((c) => c.name !== primary?.name);
  const preview = previewExcludingPk.slice(0, previewCount);
  const rest = previewExcludingPk.slice(previewCount);

  return {
    primary,
    visible: finalVisible,
    hidden: hiddenCols,
    preview,
    rest,
  };
};
