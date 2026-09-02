import { describe, expect, it } from "vitest";
import type { Transaction } from "@expense-tracker/domain";
import {
  calculateLinearTrend,
  analyzeSpendingTrend,
  analyzeSavingsTrend,
  analyzeCategoryChanges,
  analyzeWeekendBehavior,
  analyzeSpendingVolatility,
  analyzeTransactionFrequency,
  generatePatternAnalysisReport,
} from "../src/pattern-analyzer";

describe("Phase 8 Statistical Pattern Analyzer", () => {
  describe("Linear Trend Analysis (OLS)", () => {
    it("returns null for fewer than 2 data points", () => {
      expect(calculateLinearTrend([])).toBeNull();
      expect(calculateLinearTrend([100])).toBeNull();
    });

    it("correctly computes upward spending trend", () => {
      const values = [10000, 12000, 14000, 16000];
      const trend = calculateLinearTrend(values);

      expect(trend).not.toBeNull();
      expect(trend?.slope).toBe(2000);
      expect(trend?.intercept).toBe(10000);
      expect(trend?.rSquared).toBe(1.0);
      expect(trend?.direction).toBe("increasing");
      expect(trend?.percentageGrowth).toBe(60);
    });

    it("correctly computes downward savings trend", () => {
      const values = [20000, 16000, 12000, 8000];
      const trend = calculateLinearTrend(values);

      expect(trend).not.toBeNull();
      expect(trend?.slope).toBe(-4000);
      expect(trend?.direction).toBe("decreasing");
      expect(trend?.percentageGrowth).toBe(-60);
    });

    it("identifies stable trajectory", () => {
      const values = [50000, 50100, 49950, 50050];
      const trend = calculateLinearTrend(values);

      expect(trend).not.toBeNull();
      expect(trend?.direction).toBe("stable");
    });
  });

  describe("Spending & Savings Trend Wrappers", () => {
    it("evaluates monthly spending and savings points", () => {
      const spendingPoints = [
        {
          month: "2026-01",
          totalExpense: 30000,
          transactionCount: 15,
          averageTransactionAmount: 2000,
        },
        {
          month: "2026-02",
          totalExpense: 35000,
          transactionCount: 18,
          averageTransactionAmount: 1944.44,
        },
        {
          month: "2026-03",
          totalExpense: 40000,
          transactionCount: 20,
          averageTransactionAmount: 2000,
        },
      ];
      const savingsPoints = [
        { month: "2026-01", income: 50000, expense: 30000, savings: 20000, savingsRate: 40.0 },
        { month: "2026-02", income: 50000, expense: 35000, savings: 15000, savingsRate: 30.0 },
        { month: "2026-03", income: 50000, expense: 40000, savings: 10000, savingsRate: 20.0 },
      ];

      const spTrend = analyzeSpendingTrend(spendingPoints);
      const svTrend = analyzeSavingsTrend(savingsPoints);

      expect(spTrend?.direction).toBe("increasing");
      expect(svTrend?.direction).toBe("decreasing");
    });
  });

  describe("Category Dynamics Analysis", () => {
    it("detects growing, declining, new, and inactive categories", () => {
      const transactions: Transaction[] = [
        // Month 1: 2026-01
        {
          id: "t1",
          type: "expense",
          amount: 5000,
          categoryId: "Food",
          paymentMethod: "UPI",
          transactionDate: "2026-01-10",
          description: "Groceries",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "t2",
          type: "expense",
          amount: 8000,
          categoryId: "Shopping",
          paymentMethod: "Credit Card",
          transactionDate: "2026-01-15",
          description: "Clothes",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "t3",
          type: "expense",
          amount: 2000,
          categoryId: "Entertainment",
          paymentMethod: "UPI",
          transactionDate: "2026-01-20",
          description: "Cinema",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        // Month 2: 2026-02
        {
          id: "t4",
          type: "expense",
          amount: 9000,
          categoryId: "Food", // Growing: 5000 -> 9000 (+80%)
          paymentMethod: "UPI",
          transactionDate: "2026-02-05",
          description: "Groceries & Dining",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "t5",
          type: "expense",
          amount: 3000,
          categoryId: "Shopping", // Declining: 8000 -> 3000 (-62.5%)
          paymentMethod: "Credit Card",
          transactionDate: "2026-02-12",
          description: "Small purchase",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "t6",
          type: "expense",
          amount: 4000,
          categoryId: "Travel", // New: 0 -> 4000
          paymentMethod: "Net Banking",
          transactionDate: "2026-02-18",
          description: "Bus trip",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        // Entertainment inactive in month 2 (2000 -> 0)
      ];

      const dynamics = analyzeCategoryChanges(transactions);

      expect(dynamics.topGrowingCategory).toBe("Food");
      expect(dynamics.topDecliningCategory).toBe("Shopping");

      const travelShift = dynamics.shifts.find((s) => s.category === "Travel");
      expect(travelShift?.status).toBe("new");

      const entShift = dynamics.shifts.find((s) => s.category === "Entertainment");
      expect(entShift?.status).toBe("inactive");
    });
  });

  describe("Weekend Behavior Analysis", () => {
    it("distinguishes weekend from weekday expenses", () => {
      // 2026-05-01 is Friday (weekday)
      // 2026-05-02 is Saturday (weekend)
      // 2026-05-03 is Sunday (weekend)
      // 2026-05-04 is Monday (weekday)
      const transactions: Transaction[] = [
        {
          id: "w1",
          type: "expense",
          amount: 1000,
          categoryId: "Food",
          paymentMethod: "UPI",
          transactionDate: "2026-05-01", // Friday
          description: "Lunch",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "w2",
          type: "expense",
          amount: 3000,
          categoryId: "Dining",
          paymentMethod: "Credit Card",
          transactionDate: "2026-05-02", // Saturday
          description: "Dinner Party",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "w3",
          type: "expense",
          amount: 2000,
          categoryId: "Entertainment",
          paymentMethod: "UPI",
          transactionDate: "2026-05-03", // Sunday
          description: "Movie",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "w4",
          type: "expense",
          amount: 1000,
          categoryId: "Transport",
          paymentMethod: "UPI",
          transactionDate: "2026-05-04", // Monday
          description: "Fuel",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const weekend = analyzeWeekendBehavior(transactions);

      expect(weekend.weekendExpense).toBe(5000); // 3000 + 2000
      expect(weekend.weekdayExpense).toBe(2000); // 1000 + 1000
      expect(weekend.totalExpense).toBe(7000);
      expect(weekend.weekendSpendingRatio).toBeCloseTo(5000 / 7000, 3);
      expect(weekend.weekendTransactionCount).toBe(2);
      expect(weekend.weekdayTransactionCount).toBe(2);
      expect(weekend.averageWeekendTransaction).toBe(2500);
      expect(weekend.averageWeekdayTransaction).toBe(1000);
      expect(weekend.weekendSpendingPremium).toBe(2.5); // 2500 / 1000
    });
  });

  describe("Spending Volatility Classification", () => {
    it("classifies volatility accurately across CV tiers", () => {
      // Low CV
      const low = analyzeSpendingVolatility([10000, 10200, 9800, 10100]);
      expect(low.rating).toBe("low");

      // Moderate CV (~20%)
      const mod = analyzeSpendingVolatility([10000, 12500, 8000, 13000]);
      expect(mod.rating).toBe("moderate");

      // Volatile CV (>50%)
      const volatile = analyzeSpendingVolatility([5000, 35000, 2000, 40000]);
      expect(volatile.rating).toBe("volatile");
    });
  });

  describe("Transaction Velocity & Burst Flurry Detection", () => {
    it("measures velocity and detects burst flurry days", () => {
      const transactions: Transaction[] = [
        // Day 1: 1 tx
        {
          id: "f1",
          type: "expense",
          amount: 500,
          categoryId: "Food",
          paymentMethod: "UPI",
          transactionDate: "2026-06-01",
          description: "Tea",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        // Day 2: 1 tx
        {
          id: "f2",
          type: "expense",
          amount: 600,
          categoryId: "Food",
          paymentMethod: "UPI",
          transactionDate: "2026-06-02",
          description: "Snack",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        // Day 3: 5 transactions (BURST FLURRY)
        {
          id: "f3",
          type: "expense",
          amount: 1200,
          categoryId: "Shopping",
          paymentMethod: "Credit Card",
          transactionDate: "2026-06-03",
          description: "Mall 1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "f4",
          type: "expense",
          amount: 1500,
          categoryId: "Shopping",
          paymentMethod: "Credit Card",
          transactionDate: "2026-06-03",
          description: "Mall 2",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "f5",
          type: "expense",
          amount: 2500,
          categoryId: "Dining",
          paymentMethod: "Credit Card",
          transactionDate: "2026-06-03",
          description: "Dinner",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "f6",
          type: "expense",
          amount: 800,
          categoryId: "Entertainment",
          paymentMethod: "UPI",
          transactionDate: "2026-06-03",
          description: "Arcade",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "f7",
          type: "expense",
          amount: 400,
          categoryId: "Transport",
          paymentMethod: "Cash",
          transactionDate: "2026-06-03",
          description: "Cab",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const freq = analyzeTransactionFrequency(transactions);

      expect(freq.totalTransactions).toBe(7);
      expect(freq.activeDaysCount).toBe(3);
      expect(freq.spanDaysCount).toBe(3);
      expect(freq.dailyVelocity).toBeCloseTo(2.33, 2);
      expect(freq.maxDailyTransactionCount).toBe(5);
      expect(freq.burstDays).toHaveLength(1);
      expect(freq.burstDays[0]?.date).toBe("2026-06-03");
      expect(freq.burstDays[0]?.transactionCount).toBe(5);
      expect(freq.burstDays[0]?.totalAmount).toBe(6400);
    });
  });

  describe("Unified Financial Pattern Report", () => {
    it("generates a complete pattern report without errors", () => {
      const transactions: Transaction[] = [
        {
          id: "u1",
          type: "income",
          amount: 50000,
          categoryId: "Salary",
          paymentMethod: "Bank Transfer",
          transactionDate: "2026-01-01",
          description: "Jan Salary",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "u2",
          type: "expense",
          amount: 25000,
          categoryId: "Rent",
          paymentMethod: "Net Banking",
          transactionDate: "2026-01-05",
          description: "Jan Rent",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "u3",
          type: "income",
          amount: 50000,
          categoryId: "Salary",
          paymentMethod: "Bank Transfer",
          transactionDate: "2026-02-01",
          description: "Feb Salary",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "u4",
          type: "expense",
          amount: 30000,
          categoryId: "Rent",
          paymentMethod: "Net Banking",
          transactionDate: "2026-02-05",
          description: "Feb Rent & Utilities",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const report = generatePatternAnalysisReport(transactions);

      expect(report.spendingTrend).not.toBeNull();
      expect(report.savingsTrend).not.toBeNull();
      expect(report.categoryDynamics).toBeDefined();
      expect(report.weekendBehavior).toBeDefined();
      expect(report.spendingVolatility).toBeDefined();
      expect(report.transactionFrequency.totalTransactions).toBe(4);
    });
  });
});
