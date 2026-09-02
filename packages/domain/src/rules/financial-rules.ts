/**
 * Authoritative Deterministic Financial Rules Engine
 * Implements core financial formulas defined in Section 8 of the Master Prompt
 * and Section 12 of the Product Document.
 */

import type { Transaction } from "../types/transaction.js";
import type { GoalAllocation } from "../types/goal.js";

/**
 * Standard monetary rounding helper (rounds to 2 decimal places to eliminate floating point issues).
 */
export function roundCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Calculate Total Income: SUM(all income transactions)
 */
export function calculateTotalIncome(transactions: ReadonlyArray<Transaction>): number {
  const sum = transactions.filter((t) => t.type === "income").reduce((acc, t) => acc + t.amount, 0);
  return roundCurrency(sum);
}

/**
 * Calculate Total Expenses: SUM(all expense transactions)
 */
export function calculateTotalExpenses(transactions: ReadonlyArray<Transaction>): number {
  const sum = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);
  return roundCurrency(sum);
}

/**
 * Calculate Net Savings: Total Income - Total Expenses
 */
export function calculateSavings(totalIncome: number, totalExpenses: number): number {
  return roundCurrency(totalIncome - totalExpenses);
}

/**
 * Calculate Savings Rate: (Savings / Total Income) * 100
 *
 * CRITICAL RULE: If total income <= 0, returns null (N/A).
 * Never divide by zero.
 */
export function calculateSavingsRate(savings: number, totalIncome: number): number | null {
  if (totalIncome <= 0) {
    return null;
  }
  const rate = (savings / totalIncome) * 100;
  return roundCurrency(rate);
}

/**
 * Calculate Total Goal Allocations: Sum of allocation records.
 * Can filter by goalId, or compute across all goals.
 */
export function calculateGoalAllocatedTotal(
  allocations: ReadonlyArray<GoalAllocation>,
  goalId?: string,
): number {
  const filtered = goalId ? allocations.filter((a) => a.goalId === goalId) : allocations;
  const total = filtered.reduce((acc, a) => acc + a.amount, 0);
  return roundCurrency(Math.max(0, total));
}

/**
 * Calculate Available to Spend:
 * Core V1 Metric: Bank Balance - Total Goal Allocations
 */
export function calculateAvailableToSpend(
  bankBalance: number,
  totalGoalAllocations: number,
): number {
  return roundCurrency(bankBalance - totalGoalAllocations);
}

export interface AllocationValidationResult {
  isValid: boolean;
  reason?: string;
  resultingTotalAllocation: number;
  resultingAvailableToSpend: number;
}

/**
 * Validates a proposed goal allocation against the V1 invariant:
 * Total Goal Allocations <= Bank Balance
 *
 * Also validates that de-allocations (negative amount) do not exceed the goal's current allocated funds.
 */
export function validateGoalAllocation(params: {
  deltaAmount: number;
  currentTotalAllocationsAcrossAllGoals: number;
  currentGoalAllocation: number;
  currentBankBalance: number;
}): AllocationValidationResult {
  const {
    deltaAmount,
    currentTotalAllocationsAcrossAllGoals,
    currentGoalAllocation,
    currentBankBalance,
  } = params;

  if (deltaAmount === 0) {
    return {
      isValid: false,
      reason: "Allocation delta must be non-zero.",
      resultingTotalAllocation: currentTotalAllocationsAcrossAllGoals,
      resultingAvailableToSpend: calculateAvailableToSpend(
        currentBankBalance,
        currentTotalAllocationsAcrossAllGoals,
      ),
    };
  }

  // Deallocation check: cannot reduce below 0 for this specific goal
  if (deltaAmount < 0 && currentGoalAllocation + deltaAmount < 0) {
    return {
      isValid: false,
      reason: `Cannot deallocate ${Math.abs(deltaAmount)}: only ${currentGoalAllocation} is allocated to this goal.`,
      resultingTotalAllocation: currentTotalAllocationsAcrossAllGoals,
      resultingAvailableToSpend: calculateAvailableToSpend(
        currentBankBalance,
        currentTotalAllocationsAcrossAllGoals,
      ),
    };
  }

  const resultingTotalAllocation = roundCurrency(
    currentTotalAllocationsAcrossAllGoals + deltaAmount,
  );
  const resultingAvailableToSpend = calculateAvailableToSpend(
    currentBankBalance,
    resultingTotalAllocation,
  );

  // V1 Invariant: Total Goal Allocations <= Bank Balance
  if (resultingTotalAllocation > currentBankBalance) {
    return {
      isValid: false,
      reason: `Total allocated (${resultingTotalAllocation}) would exceed Bank Balance (${currentBankBalance}). Available to spend is only ${calculateAvailableToSpend(currentBankBalance, currentTotalAllocationsAcrossAllGoals)}.`,
      resultingTotalAllocation,
      resultingAvailableToSpend,
    };
  }

  return {
    isValid: true,
    resultingTotalAllocation,
    resultingAvailableToSpend,
  };
}

export interface GoalProgressResult {
  allocatedAmount: number;
  targetAmount: number;
  percentage: number;
  remainingAmount: number;
  isCompleted: boolean;
}

/**
 * Calculate progress metrics for a financial goal.
 */
export function calculateGoalProgress(
  allocatedAmount: number,
  targetAmount: number,
): GoalProgressResult {
  if (targetAmount <= 0) {
    return {
      allocatedAmount: roundCurrency(allocatedAmount),
      targetAmount: roundCurrency(targetAmount),
      percentage: 0,
      remainingAmount: 0,
      isCompleted: true,
    };
  }

  const percentage = roundCurrency((allocatedAmount / targetAmount) * 100);
  const remainingAmount = roundCurrency(Math.max(0, targetAmount - allocatedAmount));
  const isCompleted = allocatedAmount >= targetAmount;

  return {
    allocatedAmount: roundCurrency(allocatedAmount),
    targetAmount: roundCurrency(targetAmount),
    percentage,
    remainingAmount,
    isCompleted,
  };
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  savings: number;
  savingsRate: number | null;
  bankBalance: number;
  totalGoalAllocations: number;
  availableToSpend: number;
  netCashFlow: number;
}

/**
 * Calculates the complete deterministic financial summary snapshot.
 */
export function calculateFinancialSummary(params: {
  transactions: ReadonlyArray<Transaction>;
  bankBalance: number;
  allocations: ReadonlyArray<GoalAllocation>;
}): FinancialSummary {
  const { transactions, bankBalance, allocations } = params;

  const totalIncome = calculateTotalIncome(transactions);
  const totalExpenses = calculateTotalExpenses(transactions);
  const savings = calculateSavings(totalIncome, totalExpenses);
  const savingsRate = calculateSavingsRate(savings, totalIncome);
  const totalGoalAllocations = calculateGoalAllocatedTotal(allocations);
  const availableToSpend = calculateAvailableToSpend(bankBalance, totalGoalAllocations);

  return {
    totalIncome,
    totalExpenses,
    savings,
    savingsRate,
    bankBalance: roundCurrency(bankBalance),
    totalGoalAllocations,
    availableToSpend,
    netCashFlow: savings,
  };
}
