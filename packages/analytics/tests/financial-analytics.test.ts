import { describe, it, expect } from "vitest";
import type { Transaction } from "@expense-tracker/domain";
import {
  calculateIncome,
  calculateExpense,
  calculateCategorySpending,
  calculateMonthlySpending,
  calculateMonthlySavings,
  calculateSpendingChange,
  calculateSavingsChange,
  calculateVolatility,
  generateFinancialAnalytics,
  extractYearMonth,
} from "../src/index.js";

describe("Deterministic Financial Analytics Engine", () => {
  const sampleTransactions: Transaction[] = [
    {
      id: "tx-1",
      amount: 60000,
      type: "income",
      category: "Salary",
      date: "2026-01-01",
      paymentMethod: "Bank Transfer",
      description: "January Pay",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "tx-2",
      amount: 15000,
      type: "expense",
      category: "Food",
      date: "2026-01-05",
      paymentMethod: "UPI",
      description: "Groceries",
      createdAt: "2026-01-05T00:00:00Z",
      updatedAt: "2026-01-05T00:00:00Z",
    },
    {
      id: "tx-3",
      amount: 10000,
      type: "expense",
      category: "Bills",
      date: "2026-01-15",
      paymentMethod: "Net Banking",
      description: "Utilities",
      createdAt: "2026-01-15T00:00:00Z",
      updatedAt: "2026-01-15T00:00:00Z",
    },
    {
      id: "tx-4",
      amount: 5000,
      type: "expense",
      category: "Food",
      date: "2026-01-20",
      paymentMethod: "Credit Card",
      description: "Dinner",
      createdAt: "2026-01-20T00:00:00Z",
      updatedAt: "2026-01-20T00:00:00Z",
    },
    {
      id: "tx-5",
      amount: 60000,
      type: "income",
      category: "Salary",
      date: "2026-02-01",
      paymentMethod: "Bank Transfer",
      description: "February Pay",
      createdAt: "2026-02-01T00:00:00Z",
      updatedAt: "2026-02-01T00:00:00Z",
    },
    {
      id: "tx-6",
      amount: 18000,
      type: "expense",
      category: "Food",
      date: "2026-02-10",
      paymentMethod: "UPI",
      description: "Groceries & Dining",
      createdAt: "2026-02-10T00:00:00Z",
      updatedAt: "2026-02-10T00:00:00Z",
    },
    {
      id: "tx-7",
      amount: 12000,
      type: "expense",
      category: "Shopping",
      date: "2026-02-18",
      paymentMethod: "Credit Card",
      description: "Clothes",
      createdAt: "2026-02-18T00:00:00Z",
      updatedAt: "2026-02-18T00:00:00Z",
    },
    {
      id: "tx-8",
      amount: 10000,
      type: "expense",
      category: "Bills",
      date: "2026-02-25",
      paymentMethod: "Net Banking",
      description: "Electricity",
      createdAt: "2026-02-25T00:00:00Z",
      updatedAt: "2026-02-25T00:00:00Z",
    },
  ];

  describe("Income, Expense, and Savings", () => {
    it("computes total income and total expense accurately", () => {
      expect(calculateIncome(sampleTransactions)).toBe(120000);
      expect(calculateExpense(sampleTransactions)).toBe(70000);
    });

    it("handles empty transactions gracefully", () => {
      expect(calculateIncome([])).toBe(0);
      expect(calculateExpense([])).toBe(0);
    });
  });

  describe("Category Spending", () => {
    it("aggregates spending by category, calculates percentages, and sorts descending", () => {
      const breakdown = calculateCategorySpending(sampleTransactions);
      expect(breakdown).toHaveLength(3);

      // Food: 15000 + 5000 + 18000 = 38000 (38000 / 70000 * 100 = 54.29%)
      expect(breakdown[0].category).toBe("Food");
      expect(breakdown[0].amount).toBe(38000);
      expect(breakdown[0].transactionCount).toBe(3);
      expect(breakdown[0].percentage).toBe(54.29);

      // Bills: 10000 + 10000 = 20000 (20000 / 70000 * 100 = 28.57%)
      expect(breakdown[1].category).toBe("Bills");
      expect(breakdown[1].amount).toBe(20000);
      expect(breakdown[1].transactionCount).toBe(2);
      expect(breakdown[1].percentage).toBe(28.57);

      // Shopping: 12000 (12000 / 70000 * 100 = 17.14%)
      expect(breakdown[2].category).toBe("Shopping");
      expect(breakdown[2].amount).toBe(12000);
      expect(breakdown[2].transactionCount).toBe(1);
      expect(breakdown[2].percentage).toBe(17.14);
    });

    it("returns empty array when there are no expense transactions", () => {
      const incomeOnly: Transaction[] = [sampleTransactions[0]];
      expect(calculateCategorySpending(incomeOnly)).toEqual([]);
    });
  });

  describe("Monthly Spending Timeline", () => {
    it("computes chronological monthly totals, counts, and averages", () => {
      const monthly = calculateMonthlySpending(sampleTransactions);
      expect(monthly).toHaveLength(2);

      // January: 15000 + 10000 + 5000 = 30000 across 3 txs -> avg 10000
      expect(monthly[0]).toEqual({
        month: "2026-01",
        totalExpense: 30000,
        transactionCount: 3,
        averageTransactionAmount: 10000,
      });

      // February: 18000 + 12000 + 10000 = 40000 across 3 txs -> avg 13333.33
      expect(monthly[1]).toEqual({
        month: "2026-02",
        totalExpense: 40000,
        transactionCount: 3,
        averageTransactionAmount: 13333.33,
      });
    });
  });

  describe("Monthly Savings Timeline", () => {
    it("computes monthly income, expense, net savings, and savings rate", () => {
      const savings = calculateMonthlySavings(sampleTransactions);
      expect(savings).toHaveLength(2);

      // January: income 60000, expense 30000 -> savings 30000 (50%)
      expect(savings[0]).toEqual({
        month: "2026-01",
        income: 60000,
        expense: 30000,
        savings: 30000,
        savingsRate: 50,
      });

      // February: income 60000, expense 40000 -> savings 20000 (33.33%)
      expect(savings[1]).toEqual({
        month: "2026-02",
        income: 60000,
        expense: 40000,
        savings: 20000,
        savingsRate: 33.33,
      });
    });
  });

  describe("Trend Changes (Spending & Savings Changes)", () => {
    it("computes month-over-month spending increase", () => {
      const monthlySpending = calculateMonthlySpending(sampleTransactions);
      const change = calculateSpendingChange(monthlySpending);

      expect(change).not.toBeNull();
      expect(change?.previousValue).toBe(30000);
      expect(change?.currentValue).toBe(40000);
      expect(change?.absoluteChange).toBe(10000);
      expect(change?.percentageChange).toBe(33.33);
      expect(change?.direction).toBe("increase");
    });

    it("computes month-over-month savings decline", () => {
      const monthlySavings = calculateMonthlySavings(sampleTransactions);
      const change = calculateSavingsChange(monthlySavings);

      expect(change).not.toBeNull();
      expect(change?.previousValue).toBe(30000);
      expect(change?.currentValue).toBe(20000);
      expect(change?.absoluteChange).toBe(-10000);
      expect(change?.percentageChange).toBe(-33.33);
      expect(change?.direction).toBe("decrease");
    });

    it("returns null when less than two months exist", () => {
      expect(calculateSpendingChange([])).toBeNull();
      expect(calculateSpendingChange([calculateMonthlySpending(sampleTransactions)[0]])).toBeNull();
    });
  });

  describe("Volatility Calculation", () => {
    it("computes mean, sample standard deviation, and CV accurately", () => {
      const expenses = [30000, 40000];
      const vol = calculateVolatility(expenses);

      // mean = 35000
      // variance = ((30000-35000)^2 + (40000-35000)^2) / 1 = 50,000,000
      // stdDev = sqrt(50000000) = 7071.07
      // CV = 7071.07 / 35000 = 0.20
      expect(vol.mean).toBe(35000);
      expect(vol.standardDeviation).toBe(7071.07);
      expect(vol.coefficientOfVariation).toBe(0.202);
    });

    it("handles 0 or 1 point gracefully without NaN", () => {
      expect(calculateVolatility([])).toEqual({
        mean: 0,
        standardDeviation: 0,
        coefficientOfVariation: 0,
      });
      expect(calculateVolatility([5000])).toEqual({
        mean: 5000,
        standardDeviation: 0,
        coefficientOfVariation: 0,
      });
    });
  });

  describe("Comprehensive Report Generation", () => {
    it("generates full analytics report matching all component outputs", () => {
      const report = generateFinancialAnalytics(sampleTransactions);

      expect(report.totalIncome).toBe(120000);
      expect(report.totalExpense).toBe(70000);
      expect(report.netSavings).toBe(50000);
      expect(report.savingsRate).toBe(41.67);
      expect(report.categorySpending).toHaveLength(3);
      expect(report.monthlySpending).toHaveLength(2);
      expect(report.monthlySavings).toHaveLength(2);
      expect(report.spendingChange?.direction).toBe("increase");
      expect(report.savingsChange?.direction).toBe("decrease");
      expect(report.expenseVolatility.mean).toBe(35000);
      expect(report.incomeVolatility.coefficientOfVariation).toBe(0);
    });
  });

  describe("extractYearMonth Helper", () => {
    it("extracts YYYY-MM from ISO string or returns fallback", () => {
      expect(extractYearMonth("2026-05-18T12:00:00Z")).toBe("2026-05");
      expect(extractYearMonth("2026-09-02")).toBe("2026-09");
      expect(extractYearMonth("")).toBe("UNKNOWN");
    });
  });
});
