import { describe, it, expect } from "vitest";
import {
  initialMobileTransactions,
  initialMobileGoals,
  initialMobileAllocations,
} from "../src/data/sample-data.js";
import { createFinancialAnalysisEngine } from "@expense-tracker/ml-contract";
import { TransactionSchema, GoalSchema } from "@expense-tracker/schemas";

describe("Mobile App Foundation & State Binding", () => {
  it("validates mobile sample transactions against TransactionSchema", () => {
    expect(initialMobileTransactions.length).toBeGreaterThanOrEqual(4);
    for (const tx of initialMobileTransactions) {
      const parsed = TransactionSchema.safeParse(tx);
      expect(parsed.success).toBe(true);
    }
  });

  it("validates mobile sample goals against GoalSchema", () => {
    expect(initialMobileGoals.length).toBeGreaterThanOrEqual(2);
    for (const g of initialMobileGoals) {
      const parsed = GoalSchema.safeParse(g);
      expect(parsed.success).toBe(true);
    }
  });

  it("verifies financial analysis engine runs on mobile transactions", async () => {
    const engine = createFinancialAnalysisEngine();
    const result = await engine.analyze({
      transactions: initialMobileTransactions,
      period: "2026-05",
    });

    expect(result).toBeDefined();
    expect(result.summary.totalIncome).toBe(75000);
    expect(result.summary.totalExpense).toBe(43700);
    expect(result.summary.netSavings).toBe(31300);
    expect(result.summary.savingsRate).toBeCloseTo(41.73, 1);
    expect(result.persona).toBeDefined();
    expect(typeof result.persona?.archetype).toBe("string");
  });

  it("calculates savings goal progress percentages correctly for mobile UI", () => {
    const goal = initialMobileGoals[0];
    expect(goal).toBeDefined();
    if (!goal) return;
    const saved = initialMobileAllocations[goal.id] ?? 0;
    const progress = Math.min(100, Math.round((saved / goal.targetAmount) * 100));

    expect(progress).toBe(66); // 165,000 / 250,000 = 66%
  });
});
