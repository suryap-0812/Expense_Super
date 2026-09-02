/**
 * Platform-independent Repository Interfaces
 * Defined in accordance with Section 12 of the Master Prompt.
 * Concrete implementations (Tauri SQLite, Mobile SQLite, Web adapter) are implemented in platform phases.
 */

import type {
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionFilter,
} from "./transaction.js";
import type { Category, CreateCategoryInput, UpdateCategoryInput } from "./category.js";
import type {
  Goal,
  CreateGoalInput,
  UpdateGoalInput,
  GoalAllocation,
  CreateGoalAllocationInput,
} from "./goal.js";
import type { BalanceRecord, CreateBalanceRecordInput } from "./balance.js";
import type { AIInsight, CreateAIInsightInput } from "./insight.js";
import type { UserSettings } from "./settings.js";

export interface ITransactionRepository {
  create(input: CreateTransactionInput): Promise<Transaction>;
  update(id: string, input: UpdateTransactionInput): Promise<Transaction>;
  delete(id: string): Promise<void>;
  getById(id: string): Promise<Transaction | null>;
  list(filter?: TransactionFilter): Promise<Transaction[]>;
}

export interface ICategoryRepository {
  create(input: CreateCategoryInput): Promise<Category>;
  update(id: string, input: UpdateCategoryInput): Promise<Category>;
  delete(id: string): Promise<void>;
  getById(id: string): Promise<Category | null>;
  list(): Promise<Category[]>;
}

export interface IGoalRepository {
  create(input: CreateGoalInput): Promise<Goal>;
  update(id: string, input: UpdateGoalInput): Promise<Goal>;
  delete(id: string): Promise<void>;
  getById(id: string): Promise<Goal | null>;
  list(status?: string): Promise<Goal[]>;

  // Allocations
  createAllocation(input: CreateGoalAllocationInput): Promise<GoalAllocation>;
  deleteAllocation(allocationId: string): Promise<void>;
  listAllocations(goalId?: string): Promise<GoalAllocation[]>;
}

export interface IBalanceRepository {
  recordBalance(input: CreateBalanceRecordInput): Promise<BalanceRecord>;
  getLatestBalance(): Promise<BalanceRecord | null>;
  listHistory(limit?: number): Promise<BalanceRecord[]>;
}

export interface IInsightRepository {
  saveInsight(input: CreateAIInsightInput): Promise<AIInsight>;
  getById(id: string): Promise<AIInsight | null>;
  list(period?: string): Promise<AIInsight[]>;
  dismiss(id: string): Promise<void>;
}

export interface ISettingsRepository {
  getSettings(): Promise<UserSettings>;
  updateSettings(settings: Partial<UserSettings>): Promise<UserSettings>;
}
