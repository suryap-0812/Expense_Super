# Phase 22: Analytics Integration

## Overview

Phase 22 connects deterministic financial analytics directly to SQLite database repositories and reactive state stores, ensuring that all application frontends (Web Dashboard, Desktop Tauri, Mobile Expo) use the exact same underlying calculation engine without duplicate financial calculations in UI components (in accordance with Sections 8.7, 65, and 81 of `.agent/mater_prompt.md`).

## Core Invariants & Rules

- **Deterministic Financial Engine (Section 65 & 81)**: All financial calculations (total income, total expenses, net savings, savings rate, category spending distribution, monthly spending, monthly savings, and volatility) are calculated strictly by `@expense-tracker/analytics` and `@expense-tracker/domain`.
- **No Duplicate UI Logic**: UI components must never perform manual array reduce calculations, custom savings rate divisions, or ad-hoc category aggregations. All metrics flow directly from authoritative store selectors and engine outputs.
- **SQLite Data Ingestion**: The analytics engine operates directly on domain transactions retrieved from `SqliteTransactionRepository` or reactive Zustand stores, ensuring consistent behavior across cold start, live filtering, and database queries.
- **Consistency Guarantee**: Direct function outputs (`generateFinancialAnalytics`, `generatePatternAnalysisReport`) produce identical results to the unified `FinancialAnalysisEngine.analyze()` contract.

## Key Deliverables

### 1. Centralized Selectors & Helpers (`@expense-tracker/state`)

- **`useAnalysisStore` (`packages/state/src/analysis-store.ts`)**:
  - `getSummary(fallbackTransactions?)`: Returns authoritative financial totals (`totalIncome`, `totalExpense`, `netSavings`, `savingsRate`, `volatilityRating`).
  - `getDeterministicReport(transactions)`: Computes full `FinancialAnalyticsReport` directly from any transaction collection.
  - `getPatternReport(transactions)`: Computes full `PatternAnalysisReport` (weekend behavior, velocity, recurring expenses).
- **`useTransactionStore` (`packages/state/src/transaction-store.ts`)**:
  - `selectTransactionSummary(transactions)`: Centralized selector deriving rounded financial totals with 2-decimal precision.
- **Store Liquidity Invariant Selectors**:
  - `useGoalStore.getTotalAllocations()`
  - `useBalanceStore.getUnallocatedCash(totalGoalAllocations)`

### 2. UI Refactoring & Elimination of Duplicate Calculations (`apps/`)

- **Web (`apps/web`)**:
  - `SummaryCards.tsx`: Uses `getTotalAllocations()` and `getUnallocatedCash()` from stores instead of inline array reductions.
  - `AnalyticsSection.tsx`: Consumes precomputed engine analysis results with memoized fallback to deterministic analytics.
  - `App.tsx`: Passes unified engine analysis to `AnalyticsSection` and `SummaryCards`.
- **Desktop (`apps/desktop`)**:
  - `DesktopDashboardView.tsx`: Refactored to consume store selectors (`getTotalAllocations`, `getUnallocatedCash`) with zero manual arithmetic duplications.
- **Mobile (`apps/mobile`)**:
  - `SummaryCards.tsx`: Refactored to consume store selectors (`getTotalAllocations`, `getUnallocatedCash`).

### 3. Integration Testing (`packages/analytics/tests`)

- **`sqlite-analytics-integration.test.ts`**:
  - Seeds multi-month transaction streams into SQLite via `SqliteTransactionRepository`.
  - Queries filtered transaction slices by date range and category.
  - Verifies deterministic calculations across income, expenses, savings rate, category distributions, monthly timeline points, and volatility indices.
  - Verifies bit-identical outputs between direct analytics functions and `FinancialAnalysisEngine.analyze()`.

## Testing & Verification

- Tested across 15 test files (119 unit tests) in Vitest.
- Validated with 0 errors via `scripts/validate.sh` (TypeScript, ESLint, Prettier, Vitest, Pytest).
