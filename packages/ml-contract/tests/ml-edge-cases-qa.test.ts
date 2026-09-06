import { describe, it, expect } from "vitest";
import { createFinancialAnalysisEngine } from "../src/engine";
import type { Transaction } from "@expense-tracker/domain";

describe("ML Contract Edge Cases & Anomaly Robustness QA (packages/ml-contract)", () => {
  const engine = createFinancialAnalysisEngine();

  it("gracefully handles zero transactions with explicit cold-start status", async () => {
    const result = await engine.analyze({ transactions: [], period: "2026-05" });

    expect(result.summary.totalIncome).toBe(0);
    expect(result.summary.totalExpense).toBe(0);
    expect(result.summary.netSavings).toBe(0);
    expect(result.summary.savingsRate).toBeNull();
    expect(result.dataQuality.coldStart).toBe(true);
    expect(result.dataQuality.sufficientData).toBe(false);
    expect(result.insights).toBeDefined();
    expect(result.persona).toBeUndefined();
    expect(result.anomaly).toBeUndefined();
  });

  it("handles a single transaction without mathematical division by zero or NaN", async () => {
    const singleTx: Transaction = {
      id: "tx-single-1",
      amount: 12000,
      type: "expense",
      categoryId: "groceries",
      transactionDate: "2026-05-10",
      paymentMethod: "Cash",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await engine.analyze({ transactions: [singleTx], period: "2026-05" });

    expect(Number.isNaN(result.summary.totalExpense)).toBe(false);
    expect(result.summary.totalExpense).toBe(12000);
    expect(result.summary.totalIncome).toBe(0);
    expect(result.summary.savingsRate).toBeNull();
    expect(result.persona).toBeUndefined();
  });

  it("handles identical repeating transactions (zero variance) reliably", async () => {
    const identicalTxs: Transaction[] = Array.from({ length: 10 }, (_, idx) => ({
      id: `tx-identical-${idx}`,
      amount: 1500,
      type: "expense" as const,
      categoryId: "utilities",
      transactionDate: `2026-05-${String(idx + 1).padStart(2, "0")}`,
      paymentMethod: "bank_transfer" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const result = await engine.analyze({ transactions: identicalTxs, period: "2026-05" });

    expect(result.summary.totalExpense).toBe(15000);
    expect(Number.isNaN(result.summary.volatilityScore)).toBe(false);
    expect(result.summary.volatilityRating).toBeDefined();
  });

  it("handles extreme financial scales (billions) without floating point crashes", async () => {
    const extremeTxs: Transaction[] = [
      {
        id: "tx-huge-income",
        amount: 500000000, // 500 million
        type: "income",
        categoryId: "investments",
        transactionDate: "2026-05-01",
        paymentMethod: "bank_transfer",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "tx-huge-expense",
        amount: 120000000, // 120 million
        type: "expense",
        categoryId: "business",
        transactionDate: "2026-05-05",
        paymentMethod: "bank_transfer",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const result = await engine.analyze({ transactions: extremeTxs, period: "2026-05" });

    expect(result.summary.totalIncome).toBe(500000000);
    expect(result.summary.totalExpense).toBe(120000000);
    expect(result.summary.netSavings).toBe(380000000);
    expect(result.summary.savingsRate).toBe(76);
  });
});
