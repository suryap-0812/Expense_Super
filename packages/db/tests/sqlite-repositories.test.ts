import { describe, it, expect, beforeEach } from "vitest";
import { InMemorySqliteAdapter } from "../src/adapters/in-memory-adapter.js";
import { runMigrations } from "../src/migrations/index.js";
import { SqliteTransactionRepository } from "../src/repositories/transaction-repository.js";
import { SqliteCategoryRepository } from "../src/repositories/category-repository.js";
import { SqliteGoalRepository } from "../src/repositories/goal-repository.js";
import { SqliteBalanceRepository } from "../src/repositories/balance-repository.js";
import { SqliteSettingsRepository } from "../src/repositories/settings-repository.js";
import { SqliteInsightRepository } from "../src/repositories/insight-repository.js";

describe("SQLite Repositories Suite (Section 12 & 77)", () => {
  let driver: InMemorySqliteAdapter;

  beforeEach(async () => {
    driver = new InMemorySqliteAdapter();
    await runMigrations(driver);
  });

  describe("SqliteTransactionRepository", () => {
    it("creates, retrieves, updates, and deletes transactions with Zod boundary enforcement", async () => {
      const repo = new SqliteTransactionRepository(driver);

      // Create
      const tx = await repo.create({
        type: "expense",
        amount: 1450,
        categoryId: "Food",
        paymentMethod: "UPI",
        transactionDate: "2026-05-01",
        description: "Supermarket supplies",
      });
      expect(tx.id).toBeDefined();
      expect(tx.amount).toBe(1450);

      // GetById
      const fetched = await repo.getById(tx.id);
      expect(fetched).toBeDefined();
      expect(fetched?.description).toBe("Supermarket supplies");

      // Update
      const updated = await repo.update(tx.id, {
        amount: 1600,
        notes: "Included extra vegetables",
      });
      expect(updated.amount).toBe(1600);
      expect(updated.notes).toBe("Included extra vegetables");

      // List with filter
      const allTx = await repo.list({ categoryId: "Food" });
      expect(allTx.length).toBe(1);
      expect(allTx[0]?.id).toBe(tx.id);

      // Delete
      await repo.delete(tx.id);
      const afterDelete = await repo.getById(tx.id);
      expect(afterDelete).toBeNull();
    });

    it("rejects invalid transaction input via Zod validation schema", async () => {
      const repo = new SqliteTransactionRepository(driver);
      await expect(
        repo.create({
          type: "expense",
          amount: -500, // Invalid negative amount
          categoryId: "Food",
          description: "Invalid",
          paymentMethod: "UPI",
          transactionDate: "invalid-date",
        } as unknown as Parameters<typeof repo.create>[0]),
      ).rejects.toThrow();
    });
  });

  describe("SqliteCategoryRepository", () => {
    it("manages categories correctly", async () => {
      const repo = new SqliteCategoryRepository(driver);

      const cat = await repo.create({
        name: "Investment",
        type: "income",
        color: "#10b981",
      });
      expect(cat.id).toBeDefined();
      expect(cat.name).toBe("Investment");

      const list = await repo.list();
      expect(list.length).toBe(1);
      expect(list[0]?.id).toBe(cat.id);

      await repo.update(cat.id, { name: "Dividends & Investments" });
      const updated = await repo.getById(cat.id);
      expect(updated?.name).toBe("Dividends & Investments");

      await repo.delete(cat.id);
      expect(await repo.getById(cat.id)).toBeNull();
    });
  });

  describe("SqliteGoalRepository & Allocations", () => {
    it("handles goals and cascade allocations", async () => {
      const repo = new SqliteGoalRepository(driver);

      const goal = await repo.create({
        name: "Emergency Fund",
        targetAmount: 200000,
        deadline: "2026-12-31",
      });
      expect(goal.id).toBeDefined();

      const alloc = await repo.createAllocation({
        goalId: goal.id,
        amount: 25000,
        allocationDate: "2026-05-02",
      });
      expect(alloc.id).toBeDefined();

      const allocations = await repo.listAllocations(goal.id);
      expect(allocations.length).toBe(1);
      expect(allocations[0]?.amount).toBe(25000);

      await repo.deleteAllocation(alloc.id);
      expect((await repo.listAllocations(goal.id)).length).toBe(0);

      await repo.delete(goal.id);
      expect(await repo.getById(goal.id)).toBeNull();
    });
  });

  describe("SqliteBalanceRepository", () => {
    it("records and retrieves bank balance history", async () => {
      const repo = new SqliteBalanceRepository(driver);

      await repo.recordBalance({
        balance: 54000,
        recordedAt: "2026-05-01",
      });

      await repo.recordBalance({
        balance: 59000,
        recordedAt: "2026-05-05",
      });

      const latest = await repo.getLatestBalance();
      expect(latest?.balance).toBe(59000);

      const history = await repo.listHistory();
      expect(history.length).toBe(2);
    });
  });

  describe("SqliteSettingsRepository", () => {
    it("seeds defaults and updates user settings", async () => {
      const repo = new SqliteSettingsRepository(driver);

      const defaults = await repo.getSettings();
      expect(defaults.currency).toBe("INR");
      expect(defaults.theme).toBe("system");

      const updated = await repo.updateSettings({
        currency: "USD",
        theme: "dark",
      });
      expect(updated.currency).toBe("USD");
      expect(updated.theme).toBe("dark");

      const reFetched = await repo.getSettings();
      expect(reFetched.currency).toBe("USD");
    });
  });

  describe("SqliteInsightRepository", () => {
    it("saves, filters, and dismisses AI insights", async () => {
      const repo = new SqliteInsightRepository(driver);

      const insight = await repo.saveInsight({
        title: "High Dining Outlay",
        description: "Dining represents 24% of overall expenditure.",
        insightType: "anomaly",
        severity: "high",
        period: "2026-05",
        mlResult: {
          metricName: "dining_ratio",
          observedValue: 0.24,
        },
      });

      expect(insight.id).toBeDefined();

      const active = await repo.list("2026-05");
      expect(active.length).toBe(1);
      expect(active[0]?.id).toBe(insight.id);

      await repo.dismiss(insight.id);
      const afterDismiss = await repo.list("2026-05");
      expect(afterDismiss.length).toBe(0);
    });
  });
});
