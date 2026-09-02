# Phase 2: Zod Schemas & Shared Contracts Report

## Objective

Implement runtime validation boundaries across the application stack using Zod in `@expense-tracker/schemas`, deriving TypeScript types, ensuring data contracts for domain inputs, ML pipeline interfaces, LLM output validation, and portable backup import/export payloads.

## Completed Artifacts

### 1. Zod Schemas

- **Transaction Schemas** (`packages/schemas/src/transaction.schema.ts`):
  - `TransactionTypeSchema`: `"income" | "expense"`
  - `PaymentMethodSchema`: `"UPI" | "Cash" | "Credit Card" | "Debit Card" | "Net Banking" | "Bank Transfer" | "Other"`
  - `MonetaryAmountSchema`: Enforces finite positive number (> 0) with at most 2 decimal places.
  - `IsoDateStringSchema`: Enforces valid `YYYY-MM-DD` calendar dates.
  - `CreateTransactionSchema`, `UpdateTransactionSchema`, `TransactionSchema`, `TransactionFilterSchema`.
- **Category Schemas** (`packages/schemas/src/category.schema.ts`):
  - `CategoryTypeSchema`: `"income" | "expense" | "both"`
  - `CreateCategorySchema`, `UpdateCategorySchema`, `CategorySchema` (with hex color validation).
- **Goal & Allocation Schemas** (`packages/schemas/src/goal.schema.ts`):
  - `GoalStatusSchema`: `"active" | "completed" | "archived" | "cancelled"`
  - `CreateGoalSchema`, `UpdateGoalSchema`, `GoalSchema`
  - `AllocationAmountSchema`: Non-zero finite number with max 2 decimal places.
  - `CreateGoalAllocationSchema`, `GoalAllocationSchema`
- **Balance Record Schemas** (`packages/schemas/src/balance.schema.ts`):
  - `BalanceAmountSchema`: Enforces non-negative finite number (>= 0).
  - `CreateBalanceRecordSchema`, `BalanceRecordSchema`
- **ML Contract Schemas** (`packages/schemas/src/ml-contract.schema.ts`):
  - `InsightSeveritySchema`: `"info" | "low" | "medium" | "high" | "critical"`
  - `MLFeatureSetSchema`: Validates `average_monthly_income`, `average_monthly_expense`, `savings_rate`, `shopping_ratio`, `weekend_spending_ratio`.
  - `MLInputContractSchema` & `MLOutputContractSchema`: Matches Section 29 requirements.
- **LLM Contract & Safety** (`packages/schemas/src/llm-contract.schema.ts`):
  - `LLMPrioritySchema`: `"low" | "medium" | "high"`
  - `LLMFindingSchema`, `LLMGuidanceResponseSchema`
  - `parseLLMResponseSafe(input)`: Strips markdown code fences, catches JSON syntax errors, validates against schema, and guarantees untrusted model output is sanitized.
- **User Settings Schemas** (`packages/schemas/src/settings.schema.ts`):
  - `UserSettingsSchema`: Currency code/symbol, theme, terminology, LLM provider & model, anomalies threshold (`(0, 1]`).
- **Data Transfer Schemas** (`packages/schemas/src/data-transfer.schema.ts`):
  - `DataExportSchema` & `DataImportSchema`: Validates full portable backup archive.

### 2. Derived TypeScript Types

All schemas export derived types via `z.infer<typeof ...>` (e.g. `CreateTransactionInput`, `TransactionDto`, `MLInputContract`, `MLOutputContract`, `LLMGuidanceResponse`, etc.).

### 3. Test Suite

- `packages/schemas/tests/schemas.test.ts`: 24 unit tests verifying valid inputs, non-positive number rejections, decimal place restrictions, invalid date rejections, empty partial update rejections, negative balance rejections, ML contract structure, LLM safe parsing and guardrails, settings limits, and full data export schemas.
- Total workspace test count: **55 passed tests** (100% pass rate).

## Validation Results

- **TypeScript**: 0 errors across all workspace packages (`pnpm run typecheck`)
- **ESLint**: 0 errors (`pnpm run lint`)
- **Prettier**: Clean formatting (`pnpm run format:check`)
- **Vitest**: 55 passed tests across 4 test files (`pnpm run test`)
