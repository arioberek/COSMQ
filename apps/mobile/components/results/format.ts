import type { ColumnInfo } from "../../lib/types";

export type CellKind = "null" | "boolean" | "number" | "date" | "json" | "string";

export const isNullish = (v: unknown): v is null | undefined => v === null || v === undefined;

const NUMERIC_TYPES = new Set([
  "int",
  "int2",
  "int4",
  "int8",
  "smallint",
  "integer",
  "bigint",
  "tinyint",
  "mediumint",
  "decimal",
  "numeric",
  "real",
  "double",
  "double precision",
  "float",
  "float4",
  "float8",
  "money",
  "serial",
  "bigserial",
  "smallserial",
  "number",
]);

const BOOLEAN_TYPES = new Set(["bool", "boolean", "tinyint(1)", "bit"]);

const DATE_TYPES = new Set([
  "date",
  "datetime",
  "timestamp",
  "timestamptz",
  "timestamp with time zone",
  "timestamp without time zone",
  "time",
  "timetz",
]);

const JSON_TYPES = new Set(["json", "jsonb", "object", "array"]);

const TEXT_TYPES = new Set([
  "text",
  "varchar",
  "char",
  "character",
  "character varying",
  "string",
  "uuid",
  "citext",
  "name",
]);

const normalizeType = (type: string | undefined): string =>
  (type ?? "").toLowerCase().trim().split("(")[0];

export const isBooleanType = (type: string | undefined): boolean =>
  BOOLEAN_TYPES.has((type ?? "").toLowerCase().trim());

export const isNumericType = (type: string | undefined): boolean =>
  NUMERIC_TYPES.has(normalizeType(type));

export const isDateType = (type: string | undefined): boolean =>
  DATE_TYPES.has(normalizeType(type));

export const isJsonType = (type: string | undefined): boolean =>
  JSON_TYPES.has(normalizeType(type));

export const isTextType = (type: string | undefined): boolean =>
  TEXT_TYPES.has(normalizeType(type));

export const cellKind = (col: ColumnInfo, value: unknown): CellKind => {
  if (isNullish(value)) return "null";
  if (typeof value === "boolean" || isBooleanType(col.type)) return "boolean";
  // Date instances and date-typed columns come before the generic object check,
  // otherwise a Date renders as an empty JSON object.
  if (value instanceof Date) return "date";
  if (isDateType(col.type) && typeof value !== "object") return "date";
  if (typeof value === "object") return "json";
  if (isJsonType(col.type)) return "json";
  if (typeof value === "number" || isNumericType(col.type)) return "number";
  return "string";
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const tryParseDate = (raw: unknown): Date | null => {
  if (raw instanceof Date) return Number.isFinite(raw.getTime()) ? raw : null;
  if (typeof raw === "number") {
    const d = new Date(raw);
    return Number.isFinite(d.getTime()) ? d : null;
  }
  if (typeof raw !== "string") return null;
  // A bare "YYYY-MM-DD" parses as UTC midnight, which shows as the previous
  // day west of Greenwich. Read it as a local calendar date instead.
  const dateOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    const d = new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
    return Number.isFinite(d.getTime()) ? d : null;
  }
  const d = new Date(raw);
  return Number.isFinite(d.getTime()) ? d : null;
};

export const formatDate = (raw: unknown): string => {
  const d = tryParseDate(raw);
  if (!d) return String(raw ?? "");
  const now = new Date();
  const month = MONTHS[d.getMonth()];
  const day = d.getDate();
  if (d.getFullYear() === now.getFullYear()) {
    return `${month} ${day}`;
  }
  return `${month} ${day}, ${String(d.getFullYear()).slice(-2)}`;
};

export const formatNumberCompact = (n: number): string => {
  if (!Number.isFinite(n)) return String(n);
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(abs >= 1e10 ? 0 : 1)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(abs >= 1e7 ? 0 : 1)}M`;
  if (abs >= 1e4) return `${(n / 1e3).toFixed(abs >= 1e5 ? 0 : 1)}K`;
  if (Number.isInteger(n)) return n.toLocaleString();
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
};

export const formatNumberExact = (n: number): string => {
  if (!Number.isFinite(n)) return String(n);
  return Number.isInteger(n) ? n.toLocaleString() : String(n);
};

// Numbers that are labels, not quantities: ids and keys, years, zip and port
// numbers. "12.3K" or "2,026" would misrepresent them.
const LABEL_COLUMN = /(^|_)(id|pk|key|year|zip|zipcode|postcode|postal_code|port|code)$/i;
const CAMEL_ID_COLUMN = /[a-z]Id$/;

export const isLabelNumberColumn = (name: string): boolean =>
  LABEL_COLUMN.test(name) || CAMEL_ID_COLUMN.test(name);

/**
 * Display text for a numeric cell, or null when the value isn't a finite number.
 * `exact` (detail sheet, long-press) keeps the server's own text so values like
 * numeric(30,10) and integers past 2^53 are never rounded through `Number`.
 */
export const formatNumberCell = (
  column: ColumnInfo,
  value: unknown,
  exact = false,
): string | null => {
  const raw =
    typeof value === "string" ? value.trim() : typeof value === "bigint" ? value.toString() : null;
  const n = typeof value === "number" ? value : Number(raw ?? value);
  if (!Number.isFinite(n)) return null;
  if (raw !== null && /^-?\d+$/.test(raw) && !Number.isSafeInteger(n)) return raw;
  if (isLabelNumberColumn(column.name)) return raw ?? String(n);
  if (exact) return raw ?? formatNumberExact(n);
  return formatNumberCompact(n);
};

export const coerceNumber = (raw: unknown): number | null => {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw === "bigint") return Number(raw);
  if (typeof raw === "string") {
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

export const truthyBoolean = (raw: unknown): boolean => {
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "number") return raw !== 0;
  if (typeof raw === "string") {
    // MySQL sends BIT(1) as a raw byte ("\u0000" or "\u0001"), not as text.
    if (raw.length === 1 && raw.charCodeAt(0) < 32) return raw.charCodeAt(0) !== 0;
    const s = raw.toLowerCase();
    return s === "t" || s === "true" || s === "1" || s === "y" || s === "yes";
  }
  return Boolean(raw);
};

export const stringifyJson = (value: unknown): string => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export const stringifyCell = (value: unknown): string => {
  if (isNullish(value)) return "null";
  if (typeof value === "object") return stringifyJson(value);
  return String(value);
};

export const previewString = (raw: unknown, max = 32): string => {
  const s = typeof raw === "string" ? raw : stringifyCell(raw);
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
};
