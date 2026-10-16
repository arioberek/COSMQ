import type { DatabaseType } from "../types";

/** Whole-query templates shown above the editor (settings: "SQL templates"). */
export const SQL_TEMPLATES = [
  { label: "Select All", template: "SELECT * FROM " },
  { label: "Select Where", template: "SELECT * FROM table WHERE " },
  { label: "Count", template: "SELECT COUNT(*) FROM " },
  { label: "Insert", template: "INSERT INTO table (col) VALUES " },
  { label: "Update", template: "UPDATE table SET col = " },
  { label: "Delete", template: "DELETE FROM table WHERE " },
];

/** Keyword snippets inserted at the cursor (settings: "Quick actions"). */
export const SQL_QUICK_ACTIONS = [
  { label: "SELECT", value: "SELECT " },
  { label: "*", value: "* " },
  { label: "FROM", value: "FROM " },
  { label: "WHERE", value: "WHERE " },
  { label: "AND", value: "AND " },
  { label: "OR", value: "OR " },
  { label: "=", value: "= " },
  { label: "LIKE", value: "LIKE '%%'" },
  { label: "IN", value: "IN ()" },
  { label: "JOIN", value: "JOIN " },
  { label: "ON", value: "ON " },
  { label: "ORDER BY", value: "ORDER BY " },
  { label: "GROUP BY", value: "GROUP BY " },
  { label: "LIMIT", value: "LIMIT " },
  { label: "NULL", value: "IS NULL" },
  { label: "ASC", value: "ASC " },
  { label: "DESC", value: "DESC " },
];

/** One-tap queries offered on an empty results area. */
export const STARTER_QUERIES: Partial<Record<DatabaseType, string[]>> = {
  postgres: ["SELECT version();", "SELECT NOW();", "SELECT tablename FROM pg_tables LIMIT 5;"],
  cockroachdb: ["SELECT version();", "SHOW DATABASES;", "SHOW TABLES;"],
  mysql: ["SELECT VERSION();", "SHOW DATABASES;", "SHOW TABLES;"],
  mariadb: ["SELECT VERSION();", "SHOW DATABASES;", "SHOW TABLES;"],
  sqlite: ["SELECT sqlite_version();", "SELECT name FROM sqlite_master WHERE type='table';"],
};
