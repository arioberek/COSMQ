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
  if (typeof value === "object") return "json";
  if (isJsonType(col.type)) return "json";
  if (isDateType(col.type)) return "date";
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
