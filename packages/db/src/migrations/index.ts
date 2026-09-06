import type { ISqliteDriver, Migration, MigrationRecord } from "../driver.js";

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: "001_initial_schema",
    up: async (driver: ISqliteDriver) => {
      // 1. Categories Table
      await driver.execute(`
        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          color TEXT,
          icon TEXT,
          isPredefined INTEGER NOT NULL DEFAULT 0
        );
      `);

      // 2. Transactions Table
      await driver.execute(`
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          amount REAL NOT NULL,
          categoryId TEXT NOT NULL,
          description TEXT NOT NULL,
          paymentMethod TEXT NOT NULL,
          transactionDate TEXT NOT NULL,
          notes TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `);

      // 3. Goals Table
      await driver.execute(`
        CREATE TABLE IF NOT EXISTS goals (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          targetAmount REAL NOT NULL,
          deadline TEXT,
          description TEXT,
          status TEXT NOT NULL DEFAULT 'active',
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `);

      // 4. Goal Allocations Table
      await driver.execute(`
        CREATE TABLE IF NOT EXISTS goal_allocations (
          id TEXT PRIMARY KEY,
          goalId TEXT NOT NULL,
          amount REAL NOT NULL,
          allocationDate TEXT NOT NULL,
          note TEXT,
          createdAt TEXT NOT NULL,
          FOREIGN KEY (goalId) REFERENCES goals(id) ON DELETE CASCADE
        );
      `);

      // 5. Balance Records Table
      await driver.execute(`
        CREATE TABLE IF NOT EXISTS balance_records (
          id TEXT PRIMARY KEY,
          balance REAL NOT NULL,
          recordedAt TEXT NOT NULL,
          note TEXT,
          createdAt TEXT NOT NULL
        );
      `);

      // 6. AI Insights Table
      await driver.execute(`
        CREATE TABLE IF NOT EXISTS insights (
          id TEXT PRIMARY KEY,
          generatedAt TEXT NOT NULL,
          period TEXT NOT NULL,
          insightType TEXT NOT NULL,
          severity TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          mlResult TEXT,
          llmExplanation TEXT,
          actionableSteps TEXT,
          dismissed INTEGER NOT NULL DEFAULT 0,
          createdAt TEXT NOT NULL
        );
      `);

      // 7. User Settings Table
      await driver.execute(`
        CREATE TABLE IF NOT EXISTS user_settings (
          id TEXT PRIMARY KEY,
          currency TEXT NOT NULL DEFAULT 'INR',
          currencySymbol TEXT NOT NULL DEFAULT '₹',
          theme TEXT NOT NULL DEFAULT 'system',
          terminology TEXT NOT NULL DEFAULT 'default',
          llmProvider TEXT NOT NULL DEFAULT 'openrouter',
          llmApiKey TEXT,
          llmModel TEXT NOT NULL DEFAULT 'anthropic/claude-3.5-sonnet',
          notificationsEnabled INTEGER NOT NULL DEFAULT 1,
          anomaliesThreshold REAL NOT NULL DEFAULT 0.05
        );
      `);
    },
  },
  {
    version: 2,
    name: "002_performance_indexes",
    up: async (driver: ISqliteDriver) => {
      await driver.execute(
        `CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (transactionDate);`,
      );
      await driver.execute(
        `CREATE INDEX IF NOT EXISTS idx_transactions_cat ON transactions (categoryId);`,
      );
      await driver.execute(
        `CREATE INDEX IF NOT EXISTS idx_allocations_goal ON goal_allocations (goalId);`,
      );
      await driver.execute(
        `CREATE INDEX IF NOT EXISTS idx_balance_recorded ON balance_records (recordedAt);`,
      );
      await driver.execute(`CREATE INDEX IF NOT EXISTS idx_insights_period ON insights (period);`);
    },
  },
];

/**
 * Initializes the schema_migrations tracking table and executes all unapplied migrations.
 */
export async function runMigrations(
  driver: ISqliteDriver,
): Promise<{ appliedCount: number; latestVersion: number }> {
  // Ensure schema_migrations table exists
  await driver.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const appliedRows = await driver.query<MigrationRecord>(
    `SELECT version, name, applied_at FROM schema_migrations ORDER BY version ASC;`,
  );
  const appliedVersions = new Set(appliedRows.map((r) => r.version));

  let appliedCount = 0;
  let latestVersion = appliedRows.length > 0 ? appliedRows[appliedRows.length - 1]!.version : 0;

  for (const migration of MIGRATIONS) {
    if (!appliedVersions.has(migration.version)) {
      await driver.transaction(async () => {
        await migration.up(driver);
        await driver.execute(
          `INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?);`,
          [migration.version, migration.name, new Date().toISOString()],
        );
      });
      appliedCount++;
      latestVersion = migration.version;
    }
  }

  return { appliedCount, latestVersion };
}
