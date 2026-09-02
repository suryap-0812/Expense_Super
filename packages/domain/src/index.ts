/**
 * @expense-tracker/domain
 * Core domain entities, value objects, repository contracts, and deterministic financial rules.
 */

export const DOMAIN_PACKAGE_VERSION = "0.1.0";

// Transaction
export type {
  TransactionType,
  PaymentMethod,
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionFilter,
} from "./types/transaction.js";

// Category
export type {
  CategoryType,
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "./types/category.js";
export {
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_CATEGORIES,
} from "./types/category.js";

// Goal
export type {
  GoalStatus,
  Goal,
  CreateGoalInput,
  UpdateGoalInput,
  GoalAllocation,
  CreateGoalAllocationInput,
  GoalWithProgress,
} from "./types/goal.js";

// Balance
export type { BalanceRecord, CreateBalanceRecordInput } from "./types/balance.js";

// Insight
export type {
  InsightType,
  InsightSeverity,
  AIInsight,
  CreateAIInsightInput,
} from "./types/insight.js";

// Settings
export type { CurrencyCode, ThemeMode, AppTerminology, UserSettings } from "./types/settings.js";
export { DEFAULT_USER_SETTINGS } from "./types/settings.js";

// Repositories
export type {
  ITransactionRepository,
  ICategoryRepository,
  IGoalRepository,
  IBalanceRepository,
  IInsightRepository,
  ISettingsRepository,
} from "./types/repository.js";

// Deterministic Financial Rules Engine
export {
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
} from "./rules/financial-rules.js";

export type {
  AllocationValidationResult,
  GoalProgressResult,
  FinancialSummary,
} from "./rules/financial-rules.js";
