import { syntax } from "../theme";

export type Token = { text: string; color: string };

const KEYWORDS = new Set([
  "SELECT",
  "FROM",
  "WHERE",
  "ORDER",
  "BY",
  "AND",
  "OR",
  "LIMIT",
  "DELETE",
  "UPDATE",
  "SET",
  "INSERT",
  "INTO",
  "VALUES",
  "JOIN",
  "ON",
  "GROUP",
]);

/**
 * Tiny SQL tokenizer for the demo queries. Mirrors the app's editor colors
 * (which leave DESC/ASC uncolored):
 * keywords, strings, numbers, operators, punctuation, identifiers.
 * Handles partially-typed input (an unterminated string is still a string).
 */
export const tokenize = (sql: string): Token[] => {
  const tokens: Token[] = [];
  const re = /('[^']*'?)|(\d+(?:\.\d+)?)|([A-Za-z_][A-Za-z0-9_]*)|([<>=!]+)|([,;().*])|(\s+)/g;
  let last = 0;
  for (const m of sql.matchAll(re)) {
    if (m.index > last) tokens.push({ text: sql.slice(last, m.index), color: syntax.identifier });
    const [text, str, num, word, op, punct] = m;
    let color: string = syntax.identifier;
    if (str) color = syntax.string;
    else if (num) color = syntax.number;
    else if (word) color = KEYWORDS.has(word.toUpperCase()) ? syntax.keyword : syntax.identifier;
    else if (op) color = syntax.operator;
    else if (punct) color = syntax.punctuation;
    tokens.push({ text, color });
    last = m.index + text.length;
  }
  if (last < sql.length) tokens.push({ text: sql.slice(last), color: syntax.identifier });
  return tokens;
};

/** Splits highlighted tokens into lines (for line-by-line layout). */
export const tokenizeLines = (sql: string): Token[][] => {
  const lines: Token[][] = [[]];
  for (const token of tokenize(sql)) {
    const parts = token.text.split("\n");
    parts.forEach((part, i) => {
      if (i > 0) lines.push([]);
      if (part) lines[lines.length - 1].push({ text: part, color: token.color });
    });
  }
  return lines;
};

/**
 * Typing schedule: segments typed at a characters-per-frame rate, or inserted
 * at once (autocomplete). Returns the text visible at `frame`.
 */
export type TypeSegment = { text: string; start: number; cpf?: number };

export const typedText = (frame: number, segments: TypeSegment[]): string => {
  let out = "";
  for (const seg of segments) {
    if (frame < seg.start) break;
    if (!seg.cpf) {
      out += seg.text;
      continue;
    }
    // Slight, deterministic rhythm so typing doesn't feel mechanical.
    let budget = (frame - seg.start) * seg.cpf;
    let count = 0;
    for (const ch of seg.text) {
      const cost = ch === " " || ch === "\n" ? 1.6 : ch === "," || ch === ";" ? 1.3 : 1;
      if (budget < cost) break;
      budget -= cost;
      count++;
    }
    out += seg.text.slice(0, count);
    if (count < seg.text.length) break;
  }
  return out;
};
