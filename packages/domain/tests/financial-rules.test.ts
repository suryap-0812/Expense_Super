import { describe, it, expect } from "vitest";
import {
  roundCurrency,
  calculateTotalIncome,
  calculateTotalExpenses,
  calculateSavings,
  calculateSavingsRate,
  calculateGoalAllocatedTotal,
  calculateAvailableToSpend,
  validateGoalAllocation,
  calculateGoalProgress,
  calculateFinancialSummary,
  type Transaction,
  type GoalAllocation,
} from "../src/index.js";

const mockIncomeTx = (id: string, amount: number): Transaction => ({
  id,
  type: "income",
  amount,
  categoryId: "cat_inc_salary",
  description: "Salary",
  paymentMethod: "Bank Transfer",
  transactionDate: "2026-05-01",
  createdAt: "2026-05-01T10:00:00Z",
  updatedAt: "2026-05-01T10:00:00Z",
});

const mockExpenseTx = (id: string, amount: number, categoryId = "cat_exp_food"): Transaction => ({
  id,
  type: "expense",
  amount,
  categoryId,
  description: "Expense",
  paymentMethod: "UPI",
  transactionDate: "2026-05-02",
  createdAt: "2026-05-02T10:00:00Z",
  updatedAt: "2026-05-02T10:00:00Z",
});

const mockAllocation = (
  id: string,
  goalId: string,
  amount: number,
  allocationDate = "2026-05-03",
): GoalAllocation => ({
  id,
  goalId,
  amount,
  allocationDate,
  createdAt: "2026-05-03T10:00:00Z",
});

describe("Deterministic Financial Rules Engine", () => {
  describe("roundCurrency", () => {
    it("eliminates standard binary floating point errors", () => {
      expect(0.1 + 0.2).not.toBe(0.3); // IEEE 754 precision artifact
      expect(roundCurrency(0.1 + 0.2)).toBe(0.3);
      expect(roundCurrency(1234.567)).toBe(1234.57);
      expect(roundCurrency(50.001)).toBe(50);
    });
  });

  describe("calculateTotalIncome & calculateTotalExpenses", () => {
    it("correctly aggregates only income transactions", () => {
      const txs = [mockIncomeTx("1", 50000), mockIncomeTx("2", 15000.5), mockExpenseTx("3", 2500)];
      expect(calculateTotalIncome(txs)).toBe(65000.5);
    });

    it("correctly aggregates only expense transactions", () => {
      const txs = [
        mockIncomeTx("1", 50000),
        mockExpenseTx("2", 1200.25),
        mockExpenseTx("3", 850.75),
      ];
      expect(calculateTotalExpenses(txs)).toBe(2051);
    });

    it("returns 0 for empty transaction lists", () => {
      expect(calculateTotalIncome([])).toBe(0);
      expect(calculateTotalExpenses([])).toBe(0);
    });
  });

  describe("calculateSavings", () => {
    it("computes net savings as Income - Expenses", () => {
      expect(calculateSavings(50000, 35000)).toBe(15000);
      expect(calculateSavings(20000, 25000)).toBe(-5000); // deficit
      expect(calculateSavings(10000, 10000)).toBe(0);
    });
  });

  describe("calculateSavingsRate", () => {
    it("computes savings rate percentage correctly", () => {
      // (15,000 / 50,000) * 100 = 30%
      expect(calculateSavingsRate(15000, 50000)).toBe(30);

      // (2,500 / 10,000) * 100 = 25%
      expect(calculateSavingsRate(2500, 10000)).toBe(25);
    });

    it("computes negative savings rate when in deficit", () => {
      // (-5,000 / 20,000) * 100 = -25%
      expect(calculateSavingsRate(-5000, 20000)).toBe(-25);
    });

    it("CRITICAL RULE: returns null when total income is zero (division-by-zero protection)", () => {
      expect(calculateSavingsRate(0, 0)).toBeNull();
      expect(calculateSavingsRate(-1000, 0)).toBeNull();
      expect(calculateSavingsRate(0, -500)).toBeNull();
    });
  });

  describe("calculateGoalAllocatedTotal", () => {
    const allocations = [
      mockAllocation("a1", "goal_phone", 15000),
      mockAllocation("a2", "goal_emergency", 10000),
      mockAllocation("a3", "goal_emergency", 5000),
      mockAllocation("a4", "goal_phone", -2000), // reduction
    ];

    it("calculates total allocations across all goals", () => {
      expect(calculateGoalAllocatedTotal(allocations)).toBe(28000);
    });

    it("calculates total allocations for a specific goal", () => {
      expect(calculateGoalAllocatedTotal(allocations, "goal_phone")).toBe(13000);
      expect(calculateGoalAllocatedTotal(allocations, "goal_emergency")).toBe(15000);
      expect(calculateGoalAllocatedTotal(allocations, "non_existent")).toBe(0);
    });
  });

  describe("calculateAvailableToSpend", () => {
    it("computes Available to Spend = Bank Balance - Total Goal Allocations", () => {
      // Example from Master Prompt: Bank Balance = 50,000; Total Allocated = 35,000 => Available = 15,000
      expect(calculateAvailableToSpend(50000, 35000)).toBe(15000);
      expect(calculateAvailableToSpend(50000, 0)).toBe(50000);
      expect(calculateAvailableToSpend(50000, 50000)).toBe(0);
    });
  });

  describe("validateGoalAllocation", () => {
    it("allows allocation within available bank balance", () => {
      const result = validateGoalAllocation({
        deltaAmount: 10000,
        currentTotalAllocationsAcrossAllGoals: 25000,
        currentGoalAllocation: 10000,
        currentBankBalance: 50000,
      });

      expect(result.isValid).toBe(true);
      expect(result.resultingTotalAllocation).toBe(35000);
      expect(result.resultingAvailableToSpend).toBe(15000);
    });

    it("rejects allocation if Total Allocations > Bank Balance", () => {
      const result = validateGoalAllocation({
        deltaAmount: 30000,
        currentTotalAllocationsAcrossAllGoals: 25000,
        currentGoalAllocation: 10000,
        currentBankBalance: 50000,
      });

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain("would exceed Bank Balance");
    });

    it("rejects de-allocation if amount exceeds goal current allocation", () => {
      const result = validateGoalAllocation({
        deltaAmount: -15000,
        currentTotalAllocationsAcrossAllGoals: 25000,
        currentGoalAllocation: 10000,
        currentBankBalance: 50000,
      });

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain("Cannot deallocate");
    });

    it("rejects delta of 0", () => {
      const result = validateGoalAllocation({
        deltaAmount: 0,
        currentTotalAllocationsAcrossAllGoals: 10000,
        currentGoalAllocation: 5000,
        currentBankBalance: 50000,
      });

      expect(result.isValid).toBe(false);
    });
  });

  describe("calculateGoalProgress", () => {
    it("calculates progress percentage, remaining amount, and completion flag", () => {
      const progress = calculateGoalProgress(15000, 30000);
      expect(progress.percentage).toBe(50);
      expect(progress.remainingAmount).toBe(15000);
      expect(progress.isCompleted).toBe(false);
    });

    it("handles 100% completion and overfulfillment", () => {
      const full = calculateGoalProgress(30000, 30000);
      expect(full.percentage).toBe(100);
      expect(full.remainingAmount).toBe(0);
      expect(full.isCompleted).toBe(true);

      const over = calculateGoalProgress(35000, 30000);
      expect(over.percentage).toBe(116.67);
      expect(over.remainingAmount).toBe(0);
      expect(over.isCompleted).toBe(true);
    });

    it("gracefully handles targetAmount <= 0", () => {
      const result = calculateGoalProgress(100, 0);
      expect(result.isCompleted).toBe(true);
      expect(result.percentage).toBe(0);
    });
  });

  describe("calculateFinancialSummary", () => {
    it("produces complete authoritative financial summary matching Master Prompt example", () => {
      const transactions = [
        mockIncomeTx("tx_inc_1", 50000),
        mockExpenseTx("tx_exp_1", 20000),
        mockExpenseTx("tx_exp_2", 15000),
      ];

      const allocations = [
        mockAllocation("a1", "goal_phone", 15000),
        mockAllocation("a2", "goal_emergency", 10000),
        mockAllocation("a3", "goal_notouch", 10000),
      ];

      const bankBalance = 50000;

      const summary = calculateFinancialSummary({
        transactions,
        bankBalance,
        allocations,
      });

      expect(summary.totalIncome).toBe(50000);
      expect(summary.totalExpenses).toBe(35000);
      expect(summary.savings).toBe(15000);
      expect(summary.savingsRate).toBe(30);
      expect(summary.bankBalance).toBe(50000);
      expect(summary.totalGoalAllocations).toBe(35000);
      expect(summary.availableToSpend).toBe(15000);
      expect(summary.netCashFlow).toBe(15000);
    });
  });
});
