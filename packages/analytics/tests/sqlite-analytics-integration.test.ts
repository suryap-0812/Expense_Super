/**
 * Phase 22 — Analytics Integration Suite (Section 81 & 65)
 * Verifies end-to-end integration between SQLite data stores, deterministic analytics,
 * and the unified financial analysis engine.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  InMemorySqliteAdapter,
  SqliteTransactionRepository,
  runMigrations,
} from "@expense-tracker/db";
import {
  generateFinancialAnalytics,
  generatePatternAnalysisReport,
  calculateIncome,
  calculateExpense,
  calculateCategorySpending,
  calculateMonthlySpending,
  calculateMonthlySavings,
  calculateVolatility,
} from "../src/index.js";

describe("Phase 22: SQLite to Financial Analytics Integration Suite", () => {
  let driver: InMemorySqliteAdapter;
  let repo: SqliteTransactionRepository;

  beforeEach(async () => {
    driver = new InMemorySqliteAdapter();
    await runMigrations(driver);
    repo = new SqliteTransactionRepository(driver);
  });

  it("calculates deterministic analytics directly from SQLite-persisted transactions", async () => {
    // 1. Seed realistic two-month transaction stream in SQLite
    // May 2026
    await repo.create({
      type: "income",
      amount: 80000,
      categoryId: "Salary",
      paymentMethod: "Bank Transfer",
      transactionDate: "2026-05-01",
      description: "Monthly Salary Inflow",
    });
    await repo.create({
      type: "expense",
      amount: 15000,
      categoryId: "Rent",
      paymentMethod: "Net Banking",
      transactionDate: "2026-05-02",
      description: "Apartment Rent",
    });
    await repo.create({
      type: "expense",
      amount: 6000,
      categoryId: "Food",
      paymentMethod: "UPI",
      transactionDate: "2026-05-10",
      description: "Grocery shopping",
    });
    await repo.create({
      type: "expense",
      amount: 4000,
      categoryId: "Dining",
      paymentMethod: "Credit Card",
      transactionDate: "2026-05-16", // Saturday
      description: "Weekend Restaurant Outing",
    });

    // June 2026
    await repo.create({
      type: "income",
      amount: 85000,
      categoryId: "Salary",
      paymentMethod: "Bank Transfer",
      transactionDate: "2026-06-01",
      description: "Monthly Salary + Bonus",
    });
    await repo.create({
      type: "expense",
      amount: 15000,
      categoryId: "Rent",
      paymentMethod: "Net Banking",
      transactionDate: "2026-06-02",
      description: "Apartment Rent",
    });
    await repo.create({
      type: "expense",
      amount: 8000,
      categoryId: "Food",
      paymentMethod: "UPI",
      transactionDate: "2026-06-12",
      description: "Supermarket groceries",
    });
    await repo.create({
      type: "expense",
      amount: 5000,
      categoryId: "Shopping",
      paymentMethod: "Credit Card",
      transactionDate: "2026-06-20", // Saturday
      description: "Electronics purchase",
    });

    // 2. Fetch all transactions from SQLite repository
    const allTxs = await repo.list();
    expect(allTxs.length).toBe(8);

    // 3. Run deterministic financial calculations
    const totalIncome = calculateIncome(allTxs);
    const totalExpense = calculateExpense(allTxs);
    expect(totalIncome).toBe(165000); // 80k + 85k
    expect(totalExpense).toBe(53000); // (15k+6k+4k) + (15k+8k+5k) = 25k + 28k = 53k

    const analytics = generateFinancialAnalytics(allTxs);
    expect(analytics.totalIncome).toBe(165000);
    expect(analytics.totalExpense).toBe(53000);
    expect(analytics.netSavings).toBe(112000);
    expect(analytics.savingsRate).toBeCloseTo(67.9, 1);

    // 4. Verify category breakdown from SQLite dataset
    const catSpending = calculateCategorySpending(allTxs);
    expect(catSpending.length).toBe(4);
    expect(catSpending[0]?.category).toBe("Rent");
    expect(catSpending[0]?.amount).toBe(30000);
    expect(catSpending[1]?.category).toBe("Food");
    expect(catSpending[1]?.amount).toBe(14000);

    const totalPct = catSpending.reduce((sum, c) => sum + c.percentage, 0);
    expect(Math.round(totalPct)).toBe(100);

    // 5. Verify monthly trends
    const monthlySpending = calculateMonthlySpending(allTxs);
    expect(monthlySpending.length).toBe(2);
    expect(monthlySpending[0]?.month).toBe("2026-05");
    expect(monthlySpending[0]?.totalExpense).toBe(25000);
    expect(monthlySpending[1]?.month).toBe("2026-06");
    expect(monthlySpending[1]?.totalExpense).toBe(28000);

    const monthlySavings = calculateMonthlySavings(allTxs);
    expect(monthlySavings.length).toBe(2);
    expect(monthlySavings[0]?.savings).toBe(55000); // 80k - 25k
    expect(monthlySavings[1]?.savings).toBe(57000); // 85k - 28k

    // 6. Verify volatility calculation
    expect(analytics.expenseVolatility.mean).toBe(26500);
    expect(analytics.incomeVolatility.mean).toBe(82500);

    const expenseSeriesVolatility = calculateVolatility(monthlySpending.map((m) => m.totalExpense));
    expect(expenseSeriesVolatility.mean).toBe(26500);
  });

  it("evaluates statistical pattern analysis and weekend behavior on SQLite records", async () => {
    // Seed transactions
    await repo.create({
      type: "income",
      amount: 100000,
      categoryId: "Salary",
      paymentMethod: "Bank Transfer",
      transactionDate: "2026-07-01",
      description: "July Base Salary",
    });
    await repo.create({
      type: "expense",
      amount: 20000,
      categoryId: "Rent",
      paymentMethod: "Net Banking",
      transactionDate: "2026-07-03", // Friday
      description: "Housing Rent",
    });
    await repo.create({
      type: "expense",
      amount: 10000,
      categoryId: "Food",
      paymentMethod: "UPI",
      transactionDate: "2026-07-11", // Saturday
      description: "Provisions & Groceries",
    });

    const txs = await repo.list();

    const directReport = generateFinancialAnalytics(txs);
    const directPatterns = generatePatternAnalysisReport(txs);

    expect(directReport.totalIncome).toBe(100000);
    expect(directReport.totalExpense).toBe(30000);
    expect(directReport.netSavings).toBe(70000);
    expect(directReport.savingsRate).toBe(70);

    expect(directPatterns.weekendBehavior.weekendTransactionCount).toBe(1);
    expect(directPatterns.weekendBehavior.weekendExpense).toBe(10000);
    expect(directPatterns.weekendBehavior.weekendSpendingRatio).toBeCloseTo(0.333, 2);
  });

  it("handles date-filtered queries from SQLite repository", async () => {
    // Seed May and June
    await repo.create({
      type: "expense",
      amount: 5000,
      categoryId: "Shopping",
      paymentMethod: "Credit Card",
      transactionDate: "2026-05-15",
      description: "May Clothes",
    });
    await repo.create({
      type: "expense",
      amount: 7000,
      categoryId: "Shopping",
      paymentMethod: "Credit Card",
      transactionDate: "2026-06-15",
      description: "June Clothes",
    });

    const mayOnly = await repo.list({ startDate: "2026-05-01", endDate: "2026-05-31" });
    expect(mayOnly.length).toBe(1);
    expect(calculateExpense(mayOnly)).toBe(5000);

    const juneOnly = await repo.list({ startDate: "2026-06-01", endDate: "2026-06-30" });
    expect(juneOnly.length).toBe(1);
    expect(calculateExpense(juneOnly)).toBe(7000);
  });
});
