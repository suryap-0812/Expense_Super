/**
 * Authoritative Deterministic Financial Analytics Engine
 * Implements Section 65 of the Master Technical Specification (No ML).
 */

import type { Transaction } from "@expense-tracker/domain";
import {
  roundCurrency,
  calculateTotalIncome,
  calculateTotalExpenses,
  calculateSavings,
  calculateSavingsRate,
} from "@expense-tracker/domain";

import type {
  CategorySpendingItem,
  FinancialAnalyticsReport,
  MonthlySavingsPoint,
  MonthlySpendingPoint,
  TrendChange,
  TrendDirection,
  VolatilityMetrics,
} from "./types.js";

/**
 * Extracts YYYY-MM from an ISO date string safely.
 */
export function extractYearMonth(dateStr: string): string {
  if (!dateStr || dateStr.length < 7) {
    return "UNKNOWN";
  }
  return dateStr.slice(0, 7);
}

/**
 * Calculate total income across transactions.
 */
export function calculateIncome(transactions: ReadonlyArray<Transaction>): number {
  return calculateTotalIncome(transactions);
}

/**
 * Calculate total expenses across transactions.
 */
export function calculateExpense(transactions: ReadonlyArray<Transaction>): number {
  return calculateTotalExpenses(transactions);
}

function getCategoryName(tx: Transaction): string {
  return (tx as unknown as { category?: string }).category ?? tx.categoryId ?? "Uncategorized";
}

function getTransactionDateStr(tx: Transaction): string {
  return (tx as unknown as { date?: string }).date ?? tx.transactionDate ?? "";
}

/**
 * Calculate category spending breakdown with amounts, percentage shares, and transaction counts.
 * Returns categories sorted descending by expenditure amount.
 */
export function calculateCategorySpending(
  transactions: ReadonlyArray<Transaction>,
): CategorySpendingItem[] {
  const expenseTxs = transactions.filter((t) => t.type === "expense");
  const totalExpense = calculateTotalExpenses(expenseTxs);

  const categoryMap = new Map<string, { amount: number; count: number }>();

  for (const tx of expenseTxs) {
    const cat = getCategoryName(tx);
    const existing = categoryMap.get(cat) ?? { amount: 0, count: 0 };
    existing.amount += tx.amount;
    existing.count += 1;
    categoryMap.set(cat, existing);
  }

  const items: CategorySpendingItem[] = [];
  for (const [category, data] of categoryMap.entries()) {
    const roundedAmount = roundCurrency(data.amount);
    const percentage = totalExpense > 0 ? roundCurrency((roundedAmount / totalExpense) * 100) : 0;
    items.push({
      category,
      amount: roundedAmount,
      percentage,
      transactionCount: data.count,
    });
  }

  // Sort descending by amount
  return items.sort((a, b) => b.amount - a.amount);
}

/**
 * Calculate monthly spending timeline.
 * Returns sorted chronological points.
 */
export function calculateMonthlySpending(
  transactions: ReadonlyArray<Transaction>,
): MonthlySpendingPoint[] {
  const expenseTxs = transactions.filter((t) => t.type === "expense");
  const monthlyMap = new Map<string, { total: number; count: number }>();

  for (const tx of expenseTxs) {
    const ym = extractYearMonth(getTransactionDateStr(tx));
    const existing = monthlyMap.get(ym) ?? { total: 0, count: 0 };
    existing.total += tx.amount;
    existing.count += 1;
    monthlyMap.set(ym, existing);
  }

  const points: MonthlySpendingPoint[] = [];
  const sortedMonths = Array.from(monthlyMap.keys()).sort();

  for (const month of sortedMonths) {
    const data = monthlyMap.get(month);
    if (!data) continue;
    const totalExpense = roundCurrency(data.total);
    const count = data.count;
    const avg = count > 0 ? roundCurrency(totalExpense / count) : 0;
    points.push({
      month,
      totalExpense,
      transactionCount: count,
      averageTransactionAmount: avg,
    });
  }

  return points;
}

/**
 * Calculate monthly savings timeline.
 * Returns sorted chronological points.
 */
export function calculateMonthlySavings(
  transactions: ReadonlyArray<Transaction>,
): MonthlySavingsPoint[] {
  const monthlyMap = new Map<string, { income: number; expense: number }>();

  // Collect all months from all transactions
  for (const tx of transactions) {
    const ym = extractYearMonth(getTransactionDateStr(tx));
    const existing = monthlyMap.get(ym) ?? { income: 0, expense: 0 };
    if (tx.type === "income") {
      existing.income += tx.amount;
    } else if (tx.type === "expense") {
      existing.expense += tx.amount;
    }
    monthlyMap.set(ym, existing);
  }

  const points: MonthlySavingsPoint[] = [];
  const sortedMonths = Array.from(monthlyMap.keys()).sort();

  for (const month of sortedMonths) {
    const data = monthlyMap.get(month);
    if (!data) continue;
    const inc = roundCurrency(data.income);
    const exp = roundCurrency(data.expense);
    const sav = calculateSavings(inc, exp);
    const rate = calculateSavingsRate(sav, inc);

    points.push({
      month,
      income: inc,
      expense: exp,
      savings: sav,
      savingsRate: rate,
    });
  }

  return points;
}

/**
 * Computes trend changes between two numerical time-series points.
 */
export function calculateTrendChange(previousValue: number, currentValue: number): TrendChange {
  const absDiff = roundCurrency(currentValue - previousValue);
  let pctDiff: number | null = null;
  let direction: TrendDirection = "unchanged";

  if (previousValue !== 0) {
    pctDiff = roundCurrency((absDiff / Math.abs(previousValue)) * 100);
  }

  if (absDiff > 0.005) {
    direction = "increase";
  } else if (absDiff < -0.005) {
    direction = "decrease";
  }

  return {
    previousValue: roundCurrency(previousValue),
    currentValue: roundCurrency(currentValue),
    absoluteChange: absDiff,
    percentageChange: pctDiff,
    direction,
  };
}

/**
 * Calculate month-over-month spending change between the latest two months.
 */
export function calculateSpendingChange(
  monthlySpending: ReadonlyArray<MonthlySpendingPoint>,
): TrendChange | null {
  if (monthlySpending.length < 2) {
    return null;
  }
  const prev = monthlySpending[monthlySpending.length - 2];
  const curr = monthlySpending[monthlySpending.length - 1];
  if (!prev || !curr) {
    return null;
  }
  return calculateTrendChange(prev.totalExpense, curr.totalExpense);
}

/**
 * Calculate month-over-month savings change between the latest two months.
 */
export function calculateSavingsChange(
  monthlySavings: ReadonlyArray<MonthlySavingsPoint>,
): TrendChange | null {
  if (monthlySavings.length < 2) {
    return null;
  }
  const prev = monthlySavings[monthlySavings.length - 2];
  const curr = monthlySavings[monthlySavings.length - 1];
  if (!prev || !curr) {
    return null;
  }
  return calculateTrendChange(prev.savings, curr.savings);
}

/**
 * Calculate volatility metrics (mean, sample standard deviation, coefficient of variation)
 * across a numeric series (e.g. monthly expenses or monthly income).
 */
export function calculateVolatility(series: ReadonlyArray<number>): VolatilityMetrics {
  const n = series.length;
  if (n === 0) {
    return { mean: 0, standardDeviation: 0, coefficientOfVariation: 0 };
  }

  const mean = roundCurrency(series.reduce((sum, v) => sum + v, 0) / n);
  if (n === 1) {
    return { mean, standardDeviation: 0, coefficientOfVariation: 0 };
  }

  // Sample variance (ddof = 1)
  const sumSquaredDiff = series.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0);
  const variance = sumSquaredDiff / (n - 1);
  const stdDev = roundCurrency(Math.sqrt(variance));

  const cv = mean > 0 ? Math.round((stdDev / mean + Number.EPSILON) * 10000) / 10000 : 0;

  return {
    mean,
    standardDeviation: stdDev,
    coefficientOfVariation: cv,
  };
}

/**
 * Generates comprehensive deterministic financial analytics report from transactions.
 */
export function generateFinancialAnalytics(
  transactions: ReadonlyArray<Transaction>,
): FinancialAnalyticsReport {
  const totalIncome = calculateIncome(transactions);
  const totalExpense = calculateExpense(transactions);
  const netSavings = calculateSavings(totalIncome, totalExpense);
  const savingsRate = calculateSavingsRate(netSavings, totalIncome);

  const categorySpending = calculateCategorySpending(transactions);
  const monthlySpending = calculateMonthlySpending(transactions);
  const monthlySavings = calculateMonthlySavings(transactions);

  const spendingChange = calculateSpendingChange(monthlySpending);
  const savingsChange = calculateSavingsChange(monthlySavings);

  const expenseSeries = monthlySpending.map((m) => m.totalExpense);
  const incomeSeries = monthlySavings.map((m) => m.income);

  const expenseVolatility = calculateVolatility(expenseSeries);
  const incomeVolatility = calculateVolatility(incomeSeries);

  return {
    totalIncome,
    totalExpense,
    netSavings,
    savingsRate,
    categorySpending,
    monthlySpending,
    monthlySavings,
    spendingChange,
    savingsChange,
    expenseVolatility,
    incomeVolatility,
  };
}
