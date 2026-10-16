export const SQL_KEYWORDS = [
  "SELECT",
  "FROM",
  "WHERE",
  "JOIN",
  "LEFT",
  "RIGHT",
  "INNER",
  "OUTER",
  "ON",
  "AND",
  "OR",
  "NOT",
  "IN",
  "BETWEEN",
  "LIKE",
  "ORDER",
  "BY",
  "GROUP",
  "HAVING",
  "LIMIT",
  "OFFSET",
  "INSERT",
  "INTO",
  "VALUES",
  "UPDATE",
  "SET",
  "DELETE",
  "CREATE",
  "TABLE",
  "DROP",
  "ALTER",
  "INDEX",
  "NULL",
  "AS",
  "DISTINCT",
  "COUNT",
  "SUM",
  "AVG",
  "MAX",
  "MIN",
  "UNION",
  "EXISTS",
  "CASE",
  "WHEN",
  "THEN",
  "ELSE",
  "END",
  "TRUE",
  "FALSE",
];

export type TokenType =
  | "keyword"
  | "string"
  | "number"
  | "comment"
  | "operator"
  | "punctuation"
  | "identifier"
  | "default";

export interface Token {
  type: TokenType;
  value: string;
}

const KEYWORD_SET = new Set(SQL_KEYWORDS.map((k) => k.toUpperCase()));

const RULES: [TokenType, RegExp][] = [
  ["default", /^\s+/],
  ["comment", /^--[^\n]*/],
  ["string", /^'(?:[^'\\]|\\.)*'/],
  ["number", /^\d+\.?\d*/],
  ["operator", /^(<>|!=|<=|>=|::|\|\||&&|[+\-*/%=<>!&|^~])/],
  ["punctuation", /^[(),;.[\]{}]/],
];

/** Splits SQL into highlightable tokens. Concatenating the values yields the input. */
export const tokenizeSql = (sql: string): Token[] => {
  const tokens: Token[] = [];
  let remaining = sql;

  outer: while (remaining.length > 0) {
    for (const [type, pattern] of RULES) {
      const match = remaining.match(pattern);
      if (match) {
        tokens.push({ type, value: match[0] });
        remaining = remaining.slice(match[0].length);
        continue outer;
      }
    }

    const identifierMatch = remaining.match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
    if (identifierMatch) {
      const word = identifierMatch[0];
      const isKeyword = KEYWORD_SET.has(word.toUpperCase());
      tokens.push({ type: isKeyword ? "keyword" : "identifier", value: word });
      remaining = remaining.slice(word.length);
      continue;
    }

    tokens.push({ type: "default", value: remaining[0] });
    remaining = remaining.slice(1);
  }

  return tokens;
};
