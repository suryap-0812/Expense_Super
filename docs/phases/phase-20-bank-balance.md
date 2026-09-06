# Phase 20: Bank Balance System

## Overview

Phase 20 implements the authoritative bank balance management system across domain, schemas, state management, database repositories, web dashboard, desktop app, and mobile app in strict accordance with Sections 8.5, 42, and 79 of `.agent/mater_prompt.md`.

## Core Invariants & Rules

- **Non-Derived Principle (Section 8.5 & 79)**: The current bank balance is **never** automatically calculated by summing an initial balance with transaction history. Transactions may occur outside tracking scope or remain untracked. The user's manually entered bank balance is the authoritative ground truth.
- **Unallocated Cash**: Derived strictly as:
  $$\text{Unallocated Cash} = \text{Current Bank Balance} - \text{Total Goal Allocations}$$
- **Non-Negative Balance**: Bank balances must be $\ge 0$ with $\le 2$ decimal precision.

## Key Deliverables

### 1. Schema & Validation Contracts (`@expense-tracker/schemas`)

- **`CreateBalanceRecordSchema` & `UpdateBalanceRecordSchema` (`packages/schemas/src/balance.schema.ts`)**:
  - `balance`: `BalanceAmountSchema` (finite number $\ge 0$, max 2 decimals).
  - `recordedAt`: `IsoDateStringSchema` (ISO 8601 date string).
  - `note`: Optional string up to 500 characters.

### 2. State Management (`@expense-tracker/state`)

- **`useBalanceStore` (`packages/state/src/balance-store.ts`)**:
  - `currentBalance`: Holds the latest authoritative balance.
  - `balanceHistory`: Array of `BalanceRecord` items sorted descending by `recordedAt` and `createdAt`.
  - Actions: `setBalanceHistory`, `addBalanceRecord`, `updateBalanceRecord`, `deleteBalanceRecord`, `clearBalanceHistory`.
  - Selectors: `getLatestBalanceRecord()`, `getUnallocatedCash(totalGoalAllocations)`.

### 3. User Interface & Modals (`apps/web`)

- **`UpdateBalanceModal` (`apps/web/src/components/modals/UpdateBalanceModal.tsx`)**:
  - Allows entering the verified point-in-time bank balance, date of verification, and optional reconciliation memo.
  - Validates inputs using `CreateBalanceRecordSchema`.
- **`BalanceHistoryModal` (`apps/web/src/components/modals/BalanceHistoryModal.tsx`)**:
  - Audit log modal displaying historical bank balance entries, calculation deltas relative to previous records, dates, and notes.
  - Allows deleting or reviewing previous records.
- **`SummaryCards` (`apps/web/src/components/dashboard/SummaryCards.tsx`)**:
  - Prominent **Bank Balance** card labeled "Manual" with direct buttons to "Edit" or "History".
  - Dedicated **Unallocated Cash** card reflecting real-time unreserved liquidity alongside monthly income and expense metrics.

### 4. Desktop and Mobile Parity

- **Desktop (`apps/desktop`)**: Updated `DesktopDashboardView.tsx` with dedicated Bank Balance and Unallocated Cash metric cards.
- **Mobile (`apps/mobile`)**: Updated `SummaryCards.tsx` with Bank Balance and Unallocated Cash displays.

## Testing & Verification

- Unit test coverage in `packages/state/tests/state-stores.test.ts` for all balance history mutations, auto-selection of latest balance, and unallocated cash calculation.
- Verified cleanly through `scripts/validate.sh` (TypeScript, ESLint, Prettier, Vitest, and Pytest).
