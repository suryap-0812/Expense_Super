import { describe, it, expect, beforeEach } from "vitest";
import { InMemorySqliteAdapter } from "../src/adapters/in-memory-adapter";
import { runMigrations } from "../src/migrations/index";
import { SqliteTransactionRepository } from "../src/repositories/transaction-repository";
import { SqliteCategoryRepository } from "../src/repositories/category-repository";

describe("Database Concurrency & Transaction Integrity QA (packages/db)", () => {
  let driver: InMemorySqliteAdapter;
  let txRepo: SqliteTransactionRepository;
  let catRepo: SqliteCategoryRepository;

  beforeEach(async () => {
    driver = new InMemorySqliteAdapter();
    await runMigrations(driver);
    txRepo = new SqliteTransactionRepository(driver);
    catRepo = new SqliteCategoryRepository(driver);
  });

  it("rolls back all operations within an atomic transaction if a failure occurs", async () => {
    const cat = await catRepo.create({
      name: "Groceries",
      type: "expense",
      isDefault: true,
      color: "#10b981",
      icon: "shopping-cart",
    });

    const initialTxs = await txRepo.list();
    expect(initialTxs).toHaveLength(0);

    // Run atomic transaction with transaction helper and force an error
    await expect(
      driver.transaction(async () => {
        // First insert succeeds via repo
        await txRepo.create({
          type: "expense",
          amount: 1500,
          categoryId: cat.id,
          description: "Groceries Store",
          paymentMethod: "Cash",
          transactionDate: "2026-05-01",
        });

        const midTxs = await txRepo.list();
        expect(midTxs).toHaveLength(1);

        // Subsequent operation throws an unhandled business error
        throw new Error("Simulated network/concurrency interruption");
      }),
    ).rejects.toThrow("Simulated network/concurrency interruption");

    // Verify rollback: zero transactions should remain in the database
    const finalTxs = await txRepo.list();
    expect(finalTxs).toHaveLength(0);
  });

  it("supports large batch inserts efficiently without data corruption", async () => {
    const cat = await catRepo.create({
      name: "Bulk Ingestion",
      type: "expense",
      isDefault: true,
      color: "#6366f1",
      icon: "box",
    });

    const batchSize = 50;
    await driver.transaction(async () => {
      for (let i = 0; i < batchSize; i++) {
        await txRepo.create({
          type: "expense",
          amount: 100 + i,
          categoryId: cat.id,
          description: `Bulk Tx ${i}`,
          paymentMethod: "Bank Transfer",
          transactionDate: "2026-05-01",
        });
      }
    });

    const storedTxs = await txRepo.list();
    expect(storedTxs).toHaveLength(50);
  });
});
