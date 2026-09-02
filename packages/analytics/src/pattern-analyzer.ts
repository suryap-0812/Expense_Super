/**
 * Statistical Pattern Analyzer
 * Authoritative deterministic implementation of Phase 8 pattern analytics (Section 24 & 67).
 * Pure functional statistical algorithms with zero machine learning dependencies.
 */

import { roundCurrency } from "@expense-tracker/domain";
import type { Transaction } from "@expense-tracker/domain";
import {
  calculateMonthlySpending,
  calculateMonthlySavings,
  calculateVolatility,
} from "./calculator";
import type {
  CategoryDynamics,
  CategoryShift,
  FinancialPatternReport,
  FrequencyMetrics,
  MonthlySavingsPoint,
  MonthlySpendingPoint,
  PatternDirection,
  StatisticalTrendResult,
  TransactionBurstDay,
  VolatilityAnalysis,
  VolatilityRating,
  WeekendBehaviorMetrics,
} from "./types";

function getTransactionDateStr(tx: Transaction): string {
  const d: unknown = (tx as unknown as { date?: string }).date ?? tx.transactionDate;
  if (typeof d === "string") return d;
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return "1970-01-01";
}

function getCategoryName(tx: Transaction): string {
  return (tx as unknown as { category?: string }).category ?? tx.categoryId ?? "Uncategorized";
}

/**
 * Computes Ordinary Least Squares (OLS) regression parameters and coefficient of determination (R^2).
 */
export function calculateLinearTrend(values: number[]): StatisticalTrendResult | null {
  const n = values.length;
  if (n < 2) {
    return null;
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    const val = values[i];
    if (val === undefined) continue;
    sumX += i;
    sumY += val;
    sumXY += i * val;
    sumXX += i * i;
  }

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) {
    return null;
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // Compute R-squared
  const meanY = sumY / n;
  let ssTot = 0;
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const val = values[i];
    if (val === undefined) continue;
    const yPred = slope * i + intercept;
    ssTot += Math.pow(val - meanY, 2);
    ssRes += Math.pow(val - yPred, 2);
  }

  const rSquared = ssTot > 0 ? Math.max(0, Math.min(1, 1 - ssRes / ssTot)) : 1.0;

  const first = values[0] ?? 0;
  const last = values[n - 1] ?? 0;
  const percentageGrowth =
    first !== 0 ? roundCurrency(((last - first) / Math.abs(first)) * 100) : null;

  // Classify direction based on slope relative to mean scale
  const slopeThreshold = Math.abs(meanY) * 0.02; // 2% of mean per month
  let direction: PatternDirection = "stable";
  if (slope > slopeThreshold) {
    direction = "increasing";
  } else if (slope < -slopeThreshold) {
    direction = "decreasing";
  }

  let summary = `Stable trajectory with minimal slope (₹${slope.toFixed(2)}/mo).`;
  if (direction === "increasing") {
    summary = `Upward trend increasing at approximately ₹${slope.toFixed(2)} per period (R²=${rSquared.toFixed(2)}).`;
  } else if (direction === "decreasing") {
    summary = `Downward trend decreasing at approximately ₹${Math.abs(slope).toFixed(2)} per period (R²=${rSquared.toFixed(2)}).`;
  }

  return {
    slope: roundCurrency(slope),
    intercept: roundCurrency(intercept),
    rSquared: Math.round(rSquared * 10000) / 10000,
    percentageGrowth,
    direction,
    summary,
  };
}

/**
 * Analyzes spending trend across chronological monthly spending points.
 */
export function analyzeSpendingTrend(
  monthlySpending: MonthlySpendingPoint[],
): StatisticalTrendResult | null {
  if (monthlySpending.length < 2) return null;
  const expenses = monthlySpending.map((m) => m.totalExpense);
  return calculateLinearTrend(expenses);
}

/**
 * Analyzes net savings trend across chronological monthly savings points.
 */
export function analyzeSavingsTrend(
  monthlySavings: MonthlySavingsPoint[],
): StatisticalTrendResult | null {
  if (monthlySavings.length < 2) return null;
  const savings = monthlySavings.map((m) => m.savings);
  return calculateLinearTrend(savings);
}

/**
 * Analyzes category changes (growth and decline) comparing the latest two months or two halves.
 */
export function analyzeCategoryChanges(transactions: ReadonlyArray<Transaction>): CategoryDynamics {
  const expenseTxs = transactions.filter((t) => t.type === "expense");
  if (expenseTxs.length === 0) {
    return {
      shifts: [],
      growingCategories: [],
      decliningCategories: [],
      stableCategories: [],
      topGrowingCategory: null,
      topDecliningCategory: null,
    };
  }

  // Group by month
  const monthlyCategoryTotals: Record<string, Record<string, number>> = {};
  for (const tx of expenseTxs) {
    const month = getTransactionDateStr(tx).slice(0, 7);
    const cat = getCategoryName(tx);
    if (!monthlyCategoryTotals[month]) {
      monthlyCategoryTotals[month] = {};
    }
    const current = monthlyCategoryTotals[month][cat] ?? 0;
    monthlyCategoryTotals[month][cat] = roundCurrency(current + tx.amount);
  }

  const months = Object.keys(monthlyCategoryTotals).sort();

  let prevTotals: Record<string, number> = {};
  let currTotals: Record<string, number> = {};

  if (months.length >= 2) {
    const prevMonth = months[months.length - 2];
    const currMonth = months[months.length - 1];
    prevTotals = prevMonth ? (monthlyCategoryTotals[prevMonth] ?? {}) : {};
    currTotals = currMonth ? (monthlyCategoryTotals[currMonth] ?? {}) : {};
  } else {
    // Single month or insufficient monthly breakdown: split transactions chronologically
    const sorted = [...expenseTxs].sort((a, b) =>
      getTransactionDateStr(a).localeCompare(getTransactionDateStr(b)),
    );
    const mid = Math.floor(sorted.length / 2);
    for (let i = 0; i < mid; i++) {
      const item = sorted[i];
      if (item) {
        const cat = getCategoryName(item);
        prevTotals[cat] = roundCurrency((prevTotals[cat] ?? 0) + item.amount);
      }
    }
    for (let i = mid; i < sorted.length; i++) {
      const item = sorted[i];
      if (item) {
        const cat = getCategoryName(item);
        currTotals[cat] = roundCurrency((currTotals[cat] ?? 0) + item.amount);
      }
    }
  }

  const allCategories = Array.from(
    new Set([...Object.keys(prevTotals), ...Object.keys(currTotals)]),
  );

  const shifts: CategoryShift[] = [];

  for (const cat of allCategories) {
    const prev = prevTotals[cat] ?? 0;
    const curr = currTotals[cat] ?? 0;
    const absChange = roundCurrency(curr - prev);
    let pctChange: number | null = null;
    let status: CategoryShift["status"] = "stable";

    if (prev === 0 && curr > 0) {
      status = "new";
    } else if (prev > 0 && curr === 0) {
      status = "inactive";
      pctChange = -100;
    } else if (prev > 0) {
      pctChange = roundCurrency(((curr - prev) / prev) * 100);
      if (pctChange > 5) {
        status = "growing";
      } else if (pctChange < -5) {
        status = "declining";
      } else {
        status = "stable";
      }
    }

    shifts.push({
      category: cat,
      previousAmount: prev,
      currentAmount: curr,
      absoluteChange: absChange,
      percentageChange: pctChange,
      status,
    });
  }

  const growingCategories = shifts
    .filter((s) => s.status === "growing" || s.status === "new")
    .sort((a, b) => b.absoluteChange - a.absoluteChange);

  const decliningCategories = shifts
    .filter((s) => s.status === "declining" || s.status === "inactive")
    .sort((a, b) => a.absoluteChange - b.absoluteChange);

  const stableCategories = shifts.filter((s) => s.status === "stable");

  return {
    shifts,
    growingCategories,
    decliningCategories,
    stableCategories,
    topGrowingCategory: growingCategories[0]?.category ?? null,
    topDecliningCategory: decliningCategories[0]?.category ?? null,
  };
}

/**
 * Analyzes weekend vs. weekday spending and transaction behavior.
 */
export function analyzeWeekendBehavior(
  transactions: ReadonlyArray<Transaction>,
): WeekendBehaviorMetrics {
  const expenseTxs = transactions.filter((t) => t.type === "expense");

  let weekendExpense = 0;
  let weekdayExpense = 0;
  let weekendCount = 0;
  let weekdayCount = 0;

  for (const tx of expenseTxs) {
    const dateStr = getTransactionDateStr(tx);
    const date = new Date(dateStr + "T00:00:00Z");
    const day = date.getUTCDay(); // 0 = Sunday, 6 = Saturday

    if (day === 0 || day === 6) {
      weekendExpense += tx.amount;
      weekendCount += 1;
    } else {
      weekdayExpense += tx.amount;
      weekdayCount += 1;
    }
  }

  weekendExpense = roundCurrency(weekendExpense);
  weekdayExpense = roundCurrency(weekdayExpense);
  const totalExpense = roundCurrency(weekendExpense + weekdayExpense);
  const totalCount = weekendCount + weekdayCount;

  const weekendSpendingRatio =
    totalExpense > 0 ? Math.round((weekendExpense / totalExpense) * 10000) / 10000 : 0;
  const weekendTransactionRatio =
    totalCount > 0 ? Math.round((weekendCount / totalCount) * 10000) / 10000 : 0;

  const avgWeekend = weekendCount > 0 ? roundCurrency(weekendExpense / weekendCount) : 0;
  const avgWeekday = weekdayCount > 0 ? roundCurrency(weekdayExpense / weekdayCount) : 0;

  const weekendSpendingPremium =
    avgWeekday > 0 ? Math.round((avgWeekend / avgWeekday) * 100) / 100 : 1.0;

  return {
    weekendExpense,
    weekdayExpense,
    totalExpense,
    weekendSpendingRatio,
    weekendTransactionCount: weekendCount,
    weekdayTransactionCount: weekdayCount,
    weekendTransactionRatio,
    averageWeekendTransaction: avgWeekend,
    averageWeekdayTransaction: avgWeekday,
    weekendSpendingPremium,
  };
}

/**
 * Calculates volatility and assigns qualitative rating.
 */
export function analyzeSpendingVolatility(amounts: number[]): VolatilityAnalysis {
  const baseVolatility = calculateVolatility(amounts);
  const cv = baseVolatility.coefficientOfVariation;

  let rating: VolatilityRating = "low";
  if (cv >= 0.5) {
    rating = "volatile";
  } else if (cv >= 0.3) {
    rating = "high";
  } else if (cv >= 0.15) {
    rating = "moderate";
  } else {
    rating = "low";
  }

  return {
    ...baseVolatility,
    rating,
  };
}

/**
 * Analyzes transaction velocity, intervals, and flurry burst days.
 */
export function analyzeTransactionFrequency(
  transactions: ReadonlyArray<Transaction>,
): FrequencyMetrics {
  const totalTransactions = transactions.length;
  if (totalTransactions === 0) {
    return {
      totalTransactions: 0,
      activeDaysCount: 0,
      spanDaysCount: 0,
      dailyVelocity: 0,
      averageInterTransactionDays: 0,
      maxDailyTransactionCount: 0,
      burstDays: [],
    };
  }

  // Aggregate by date
  const dailyCounts: Record<string, { count: number; amount: number }> = {};
  for (const tx of transactions) {
    const d = getTransactionDateStr(tx);
    if (!dailyCounts[d]) {
      dailyCounts[d] = { count: 0, amount: 0 };
    }
    dailyCounts[d].count += 1;
    if (tx.type === "expense") {
      dailyCounts[d].amount = roundCurrency(dailyCounts[d].amount + tx.amount);
    }
  }

  const activeDates = Object.keys(dailyCounts).sort();
  const activeDaysCount = activeDates.length;

  const firstDateStr = activeDates[0] ?? "1970-01-01";
  const lastDateStr = activeDates[activeDates.length - 1] ?? "1970-01-01";
  const firstDate = new Date(firstDateStr + "T00:00:00Z");
  const lastDate = new Date(lastDateStr + "T00:00:00Z");

  const diffMs = Math.abs(lastDate.getTime() - firstDate.getTime());
  const spanDaysCount = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);

  const dailyVelocity = Math.round((totalTransactions / spanDaysCount) * 100) / 100;

  // Inter-transaction days
  let totalGapDays = 0;
  for (let i = 1; i < activeDates.length; i++) {
    const prevD = activeDates[i - 1];
    const currD = activeDates[i];
    if (prevD && currD) {
      const p = new Date(prevD + "T00:00:00Z");
      const c = new Date(currD + "T00:00:00Z");
      totalGapDays += Math.max(0, Math.round((c.getTime() - p.getTime()) / (1000 * 60 * 60 * 24)));
    }
  }
  const averageInterTransactionDays =
    activeDates.length > 1 ? Math.round((totalGapDays / (activeDates.length - 1)) * 100) / 100 : 0;

  // Max daily count and burst threshold (>= 2x daily velocity and >= 3)
  let maxDailyCount = 0;
  const burstThreshold = Math.max(3, dailyVelocity * 2.0);
  const burstDays: TransactionBurstDay[] = [];

  for (const date of activeDates) {
    const entry = dailyCounts[date];
    if (entry) {
      if (entry.count > maxDailyCount) {
        maxDailyCount = entry.count;
      }
      if (entry.count >= burstThreshold) {
        burstDays.push({
          date,
          transactionCount: entry.count,
          totalAmount: entry.amount,
        });
      }
    }
  }

  return {
    totalTransactions,
    activeDaysCount,
    spanDaysCount,
    dailyVelocity,
    averageInterTransactionDays,
    maxDailyTransactionCount: maxDailyCount,
    burstDays,
  };
}

/**
 * Assembles the full deterministic financial pattern analysis report.
 */
export function generatePatternAnalysisReport(
  transactions: ReadonlyArray<Transaction>,
): FinancialPatternReport {
  const monthlySpending = calculateMonthlySpending(transactions);
  const monthlySavings = calculateMonthlySavings(transactions);

  const spendingTrend = analyzeSpendingTrend(monthlySpending);
  const savingsTrend = analyzeSavingsTrend(monthlySavings);
  const categoryDynamics = analyzeCategoryChanges(transactions);
  const weekendBehavior = analyzeWeekendBehavior(transactions);

  const expenseAmounts = monthlySpending.map((m) => m.totalExpense);
  const spendingVolatility = analyzeSpendingVolatility(expenseAmounts);
  const transactionFrequency = analyzeTransactionFrequency(transactions);

  return {
    spendingTrend,
    savingsTrend,
    categoryDynamics,
    weekendBehavior,
    spendingVolatility,
    transactionFrequency,
  };
}
