/**
 * Financial Analytics Types & Data Contracts
 * Defined for Phase 6 deterministic financial analysis and Phase 8 statistical pattern analysis.
 */

export interface CategorySpendingItem {
  category: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface MonthlySpendingPoint {
  month: string; // YYYY-MM
  totalExpense: number;
  transactionCount: number;
  averageTransactionAmount: number;
}

export interface MonthlySavingsPoint {
  month: string; // YYYY-MM
  income: number;
  expense: number;
  savings: number;
  savingsRate: number | null; // null if income <= 0
}

export type TrendDirection = "increase" | "decrease" | "unchanged";

export interface TrendChange {
  previousValue: number;
  currentValue: number;
  absoluteChange: number;
  percentageChange: number | null; // null if previousValue is 0
  direction: TrendDirection;
}

export interface VolatilityMetrics {
  mean: number;
  standardDeviation: number;
  coefficientOfVariation: number; // stdDev / mean
}

export interface FinancialAnalyticsReport {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number | null;
  categorySpending: CategorySpendingItem[];
  monthlySpending: MonthlySpendingPoint[];
  monthlySavings: MonthlySavingsPoint[];
  spendingChange: TrendChange | null;
  savingsChange: TrendChange | null;
  expenseVolatility: VolatilityMetrics;
  incomeVolatility: VolatilityMetrics;
}

// ==========================================
// Phase 8: Statistical Pattern Analysis Types
// ==========================================

export type PatternDirection = "increasing" | "decreasing" | "stable";

export interface StatisticalTrendResult {
  slope: number;
  intercept: number;
  rSquared: number;
  percentageGrowth: number | null;
  direction: PatternDirection;
  summary: string;
}

export type CategoryShiftStatus = "growing" | "declining" | "stable" | "new" | "inactive";

export interface CategoryShift {
  category: string;
  previousAmount: number;
  currentAmount: number;
  absoluteChange: number;
  percentageChange: number | null;
  status: CategoryShiftStatus;
}

export interface CategoryDynamics {
  shifts: CategoryShift[];
  growingCategories: CategoryShift[];
  decliningCategories: CategoryShift[];
  stableCategories: CategoryShift[];
  topGrowingCategory: string | null;
  topDecliningCategory: string | null;
}

export interface WeekendBehaviorMetrics {
  weekendExpense: number;
  weekdayExpense: number;
  totalExpense: number;
  weekendSpendingRatio: number; // weekendExpense / totalExpense
  weekendTransactionCount: number;
  weekdayTransactionCount: number;
  weekendTransactionRatio: number; // weekendCount / totalCount
  averageWeekendTransaction: number;
  averageWeekdayTransaction: number;
  weekendSpendingPremium: number; // avgWeekend / avgWeekday
}

export type VolatilityRating = "low" | "moderate" | "high" | "volatile";

export interface VolatilityAnalysis extends VolatilityMetrics {
  rating: VolatilityRating;
}

export interface TransactionBurstDay {
  date: string;
  transactionCount: number;
  totalAmount: number;
}

export interface FrequencyMetrics {
  totalTransactions: number;
  activeDaysCount: number;
  spanDaysCount: number;
  dailyVelocity: number;
  averageInterTransactionDays: number;
  maxDailyTransactionCount: number;
  burstDays: TransactionBurstDay[];
}

export interface FinancialPatternReport {
  spendingTrend: StatisticalTrendResult | null;
  savingsTrend: StatisticalTrendResult | null;
  categoryDynamics: CategoryDynamics;
  weekendBehavior: WeekendBehaviorMetrics;
  spendingVolatility: VolatilityAnalysis;
  transactionFrequency: FrequencyMetrics;
}
