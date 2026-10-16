import type { DatabaseType } from "./types";

export const DATABASE_LABELS: Record<DatabaseType, string> = {
  postgres: "PostgreSQL",
  mysql: "MySQL",
  mariadb: "MariaDB",
  sqlite: "SQLite",
  cockroachdb: "CockroachDB",
  mongodb: "MongoDB",
};
