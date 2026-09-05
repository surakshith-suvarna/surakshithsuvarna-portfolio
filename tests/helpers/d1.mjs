import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";

// Exercise the generated migration and real SQLite statements used by D1.
export function createTestDatabase() {
  const sqlite = new DatabaseSync(":memory:");
  const directory = new URL("../../drizzle/", import.meta.url);
  for (const file of readdirSync(directory).filter((name) => name.endsWith(".sql")).sort()) {
    sqlite.exec(readFileSync(new URL(file, directory), "utf8"));
  }
  return {
    sqlite,
    prepare(sql) {
      const statement = sqlite.prepare(sql);
      return { bind: (...values) => ({ all: async () => ({ results: statement.all(...values) }) }) };
    },
  };
}
