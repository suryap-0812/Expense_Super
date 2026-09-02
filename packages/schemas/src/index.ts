/**
 * @expense-tracker/schemas
 * Runtime validation boundaries using Zod.
 */

export const SCHEMAS_PACKAGE_VERSION = "0.1.0";

// Transaction
export {
  TransactionTypeSchema,
  PaymentMethodSchema,
  MonetaryAmountSchema,
  IsoDateStringSchema,
  CreateTransactionSchema,
  UpdateTransactionSchema,
  TransactionSchema,
  TransactionFilterSchema,
} from "./transaction.schema.js";

export type {
  TransactionType,
  PaymentMethod,
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionDto,
  TransactionFilterDto,
} from "./transaction.schema.js";

// Category
export {
  CategoryTypeSchema,
  CreateCategorySchema,
  UpdateCategorySchema,
  CategorySchema,
} from "./category.schema.js";

export type {
  CategoryType,
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryDto,
} from "./category.schema.js";

// Goal & Allocation
export {
  GoalStatusSchema,
  CreateGoalSchema,
  UpdateGoalSchema,
  GoalSchema,
  AllocationAmountSchema,
  CreateGoalAllocationSchema,
  GoalAllocationSchema,
} from "./goal.schema.js";

export type {
  GoalStatus,
  CreateGoalInput,
  UpdateGoalInput,
  GoalDto,
  CreateGoalAllocationInput,
  GoalAllocationDto,
} from "./goal.schema.js";

// Balance
export {
  BalanceAmountSchema,
  CreateBalanceRecordSchema,
  BalanceRecordSchema,
} from "./balance.schema.js";

export type { CreateBalanceRecordInput, BalanceRecordDto } from "./balance.schema.js";

// ML Contract
export {
  InsightSeveritySchema,
  MLFeatureSetSchema,
  MLInputContractSchema,
  MLInsightItemSchema,
  MLDataQualitySchema,
  MLOutputContractSchema,
} from "./ml-contract.schema.js";

export type {
  InsightSeverity,
  MLFeatureSet,
  MLInputContract,
  MLInsightItem,
  MLDataQuality,
  MLOutputContract,
} from "./ml-contract.schema.js";

// LLM Contract
export {
  LLMPrioritySchema,
  LLMFindingSchema,
  LLMGuidanceResponseSchema,
  parseLLMResponseSafe,
} from "./llm-contract.schema.js";

export type {
  LLMPriority,
  LLMFinding,
  LLMGuidanceResponse,
  SafeLLMParseResult,
} from "./llm-contract.schema.js";

// Settings
export {
  ThemeModeSchema,
  AppTerminologySchema,
  UserSettingsSchema,
  UpdateUserSettingsSchema,
} from "./settings.schema.js";

export type {
  ThemeMode,
  AppTerminology,
  UserSettingsDto,
  UpdateUserSettingsInput,
} from "./settings.schema.js";

// Data Transfer (Backup / Restore)
export { DataExportSchema, DataImportSchema } from "./data-transfer.schema.js";

export type { DataExportDto, DataImportDto } from "./data-transfer.schema.js";
