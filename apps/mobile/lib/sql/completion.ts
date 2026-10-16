import { SQL_KEYWORDS } from "./tokenizer";

type SqlContext =
  | "select"
  | "from"
  | "where"
  | "orderby"
  | "groupby"
  | "insert"
  | "update"
  | "set"
  | "join"
  | "default";

const CONTEXT_SUGGESTIONS: Record<SqlContext, string[]> = {
  select: ["*", "DISTINCT", "COUNT(*)", "SUM()", "AVG()", "MAX()", "MIN()", "FROM"],
  from: ["WHERE", "JOIN", "LEFT JOIN", "INNER JOIN", "ORDER BY", "GROUP BY", "LIMIT"],
  where: ["AND", "OR", "LIKE", "IN", "BETWEEN", "IS NULL", "IS NOT NULL", "ORDER BY", "LIMIT"],
  orderby: ["ASC", "DESC", "LIMIT"],
  groupby: ["HAVING", "ORDER BY", "LIMIT"],
  insert: ["VALUES"],
  update: ["SET"],
  set: ["WHERE"],
  join: ["ON", "WHERE"],
  default: ["SELECT", "INSERT", "UPDATE", "DELETE", "CREATE", "DROP"],
};

const detectContext = (text: string, cursorPosition: number): SqlContext => {
  const beforeCursor = text.slice(0, cursorPosition).toUpperCase();
  const trimmed = beforeCursor.replace(/\s+/g, " ").trim();

  if (/JOIN\s+\w*\s*$/i.test(trimmed)) return "join";
  if (/SET\s+.*$/i.test(trimmed)) return "set";
  if (/UPDATE\s+\w*\s*$/i.test(trimmed)) return "update";
  if (/INSERT\s+INTO\s+\w*\s*$/i.test(trimmed)) return "insert";
  if (/GROUP\s+BY\s+.*$/i.test(trimmed)) return "groupby";
  if (/ORDER\s+BY\s+.*$/i.test(trimmed)) return "orderby";
  if (/(WHERE|AND|OR)\s+.*$/i.test(trimmed)) return "where";
  if (/FROM\s+\w*\s*$/i.test(trimmed)) return "from";
  if (/SELECT\s+.*$/i.test(trimmed) && !/FROM/i.test(trimmed)) return "select";

  return "default";
};

export type WordRange = { word: string; start: number; end: number };

/** The word (identifier-ish run, `*` included) surrounding the cursor. */
export const getCurrentWord = (text: string, cursorPosition: number): WordRange => {
  const beforeCursor = text.slice(0, cursorPosition);
  const afterCursor = text.slice(cursorPosition);

  const wordStartMatch = beforeCursor.match(/[a-zA-Z_*][a-zA-Z0-9_*]*$/);
  const wordEndMatch = afterCursor.match(/^[a-zA-Z0-9_*]*/);

  const start = wordStartMatch ? cursorPosition - wordStartMatch[0].length : cursorPosition;
  const end = cursorPosition + (wordEndMatch ? wordEndMatch[0].length : 0);
  const word = text.slice(start, end);

  return { word, start, end };
};

/** Context-aware keyword suggestions for the word at the cursor (max 8). */
export const getSuggestions = (
  text: string,
  cursorPosition: number,
  currentWord: string,
): string[] => {
  const beforeCursor = text.slice(0, cursorPosition);

  if (/LIMIT\s+\d*$/i.test(beforeCursor)) return [];
  if (/OFFSET\s+\d*$/i.test(beforeCursor)) return [];
  if (currentWord && /^\d+$/.test(currentWord)) return [];
  if (currentWord.length < 1) return [];

  const context = detectContext(text, cursorPosition);
  const contextSuggestions = CONTEXT_SUGGESTIONS[context];

  const upper = currentWord.toUpperCase();
  const allSuggestions = [...new Set([...contextSuggestions, ...SQL_KEYWORDS])];

  return allSuggestions
    .filter((s) => s.toUpperCase().startsWith(upper) && s.toUpperCase() !== upper)
    .slice(0, 8);
};

/** Replaces the current word with a suggestion; returns the new text and cursor. */
export const applySuggestion = (
  text: string,
  range: WordRange,
  suggestion: string,
): { text: string; cursor: number } => {
  const needsSpace =
    !suggestion.endsWith(" ") && !suggestion.endsWith("()") && !suggestion.endsWith("%%'");
  const insertText = needsSpace ? `${suggestion} ` : suggestion;
  return {
    text: text.slice(0, range.start) + insertText + text.slice(range.end),
    cursor: range.start + insertText.length,
  };
};
