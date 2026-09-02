/**
 * Financial Analytics Types & Data Contracts
 * Defined for Phase 6 deterministic financial analysis.
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
