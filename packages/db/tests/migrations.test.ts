import { describe, it, expect } from "vitest";
import { InMemorySqliteAdapter } from "../src/adapters/in-memory-adapter.js";
import { runMigrations, MIGRATIONS } from "../src/migrations/index.js";

describe("Versioned SQLite Migrations (Section 77)", () => {
  it("runs all initial migrations in sequence on clean database", async () => {
    const driver = new InMemorySqliteAdapter();
    const result = await runMigrations(driver);

    expect(result.appliedCount).toBe(MIGRATIONS.length);
    expect(result.latestVersion).toBe(2);

    // Verify migration tracking table
    const rows = await driver.query<{ version: number; name: string }>(
      "SELECT version, name, applied_at FROM schema_migrations ORDER BY version ASC;",
    );
    expect(rows.length).toBe(2);
    expect(rows[0]?.name).toBe("001_initial_schema");
    expect(rows[1]?.name).toBe("002_performance_indexes");
  });

  it("is idempotent when run multiple times", async () => {
    const driver = new InMemorySqliteAdapter();
    const firstRun = await runMigrations(driver);
    expect(firstRun.appliedCount).toBe(2);

    const secondRun = await runMigrations(driver);
    expect(secondRun.appliedCount).toBe(0);
    expect(secondRun.latestVersion).toBe(2);
  });
});
