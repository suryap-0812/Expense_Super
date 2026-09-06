# Phase 18: SQLite Desktop & Mobile Adapters

## Overview

Phase 18 implements the SQLite database abstraction layer in `@expense-tracker/db` (`packages/db/`). It delivers versioned migrations, platform adapters (Tauri SQLite, Expo SQLite, and In-Memory SQLite for web/testing), and typed repositories with strict Zod validation boundaries across all domain entities (`Transaction`, `Category`, `Goal`, `BalanceRecord`, `UserSettings`, `AIInsight`).

## Key Deliverables

### 1. Database Driver & Migration Engine

- **Driver Abstraction (`packages/db/src/driver.ts`)**: `ISqliteDriver` interface exposing `execute()`, `query<T>()`, `transaction<T>()`, and `close()`.
- **Versioned Migrations (`packages/db/src/migrations/index.ts`)**:
  - `001_initial_schema`: Creates `schema_migrations`, `transactions`, `categories`, `goals`, `goal_allocations`, `balance_records`, `user_settings`, and `ai_insights`.
  - `002_performance_indexes`: Adds compound and single-column indices for fast query lookups (`idx_tx_date`, `idx_tx_category_date`, `idx_tx_type_date`, `idx_goals_status`, `idx_alloc_goal_date`, `idx_insights_dismissed`).
  - Migration runner tracks applied versions in `schema_migrations` and executes outstanding migrations in transactional order.

### 2. Platform-Specific SQLite Adapters

- **`InMemorySqliteAdapter` (`packages/db/src/adapters/in-memory-adapter.ts`)**: High-performance in-memory SQL execution engine for unit testing, web browser fallback, and transient operations.
- **`TauriSqliteAdapter` (`packages/db/src/adapters/tauri-adapter.ts`)**: Native IPC bridge connecting to Tauri's desktop SQLite plugin (`plugin:sqlite|execute`, `plugin:sqlite|select`) with graceful fallback.
- **`ExpoSqliteAdapter` (`packages/db/src/adapters/expo-adapter.ts`)**: Mobile adapter bridging React Native Expo's `expo-sqlite` API with batch/transaction support.

### 3. Concrete Repositories with Zod Validation Boundaries

All repositories enforce schema validation on incoming mutation payloads and outgoing database records:

- **`SqliteTransactionRepository` (`packages/db/src/repositories/transaction-repository.ts`)**: Full CRUD, range queries (`getByDateRange`), category filtering (`getByCategory`), search, and pagination.
- **`SqliteCategoryRepository` (`packages/db/src/repositories/category-repository.ts`)**: Category hierarchy, predefined category preservation, and lookup.
- **`SqliteGoalRepository` (`packages/db/src/repositories/goal-repository.ts`)**: Goal lifecycle, progress calculations, allocation creation, and cascading deletion of allocations.
- **`SqliteBalanceRepository` (`packages/db/src/repositories/balance-repository.ts`)**: Point-in-time balance snapshots and latest balance retrieval.
- **`SqliteSettingsRepository` (`packages/db/src/repositories/settings-repository.ts`)**: Singleton settings management with default seeding.
- **`SqliteInsightRepository` (`packages/db/src/repositories/insight-repository.ts`)**: Persistence of ML and LLM insights with JSON serialization of evidence and dismissal management.

## Testing & Validation

- Comprehensive Vitest test suite in `packages/db/tests/`:
  - `migrations.test.ts`: Validates sequential migration application, idempotency, and index generation.
  - `sqlite-repositories.test.ts`: Validates schema parsing, CRUD invariants, invalid payload rejection, and cascade operations.
  - `platform-adapters.test.ts`: Validates query execution, parameterized statements, transaction rollbacks, and fallback mechanisms.
- All monorepo verification suites (TypeScript compiler, ESLint, Prettier, Vitest, Pytest) passing cleanly.
