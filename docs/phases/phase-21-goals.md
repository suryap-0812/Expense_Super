# Phase 21: Goals & Allocations System

## Overview

Phase 21 implements the comprehensive Goals and Allocations management system across domain entities, schemas, state management, web modals, desktop views, and mobile progress components in strict accordance with Sections 8.6, 41, and 80 of `.agent/mater_prompt.md`.

## Core Invariants & Rules

- **Goal Allocation as Cash Reservation (Section 8.6 & 80)**: A goal allocation is a reservation of existing bank balance funds, **not** an expense or transaction.
- **Liquidity Invariant (Section 8.6 & 80)**:
  $$\text{Total Goal Allocations} \le \text{Current Bank Balance}$$
  The system strictly prevents allocations from exceeding the available unallocated bank balance.
- **Allocation Reductions**: Users can reduce funds from a goal (returning money to unallocated cash), strictly preventing the goal's cumulative allocation from dropping below zero.
- **Cascade Deletion**: Deleting a goal cleanly cascades to remove all associated historical allocations and automatically frees up the reserved cash.
- **Progress Tracking**: Progress percentage is derived strictly as:
  $$\text{Progress} = \min\left(100, \text{round}\left(\frac{\text{Allocated Amount}}{\text{Target Amount}} \times 100\right)\right)$$

## Key Deliverables

### 1. Schema & Validation Contracts (`@expense-tracker/schemas`)

- **`CreateGoalSchema` & `UpdateGoalSchema` (`packages/schemas/src/goal.schema.ts`)**:
  - `name`: String between 1 and 100 characters.
  - `targetAmount`: Positive finite number $> 0$, max 2 decimals.
  - `deadline`: Optional ISO 8601 date string.
  - `description`: Optional string up to 500 characters.
  - `status`: Enum (`active`, `completed`, `archived`, `cancelled`).
- **`CreateGoalAllocationSchema` (`packages/schemas/src/goal.schema.ts`)**:
  - `goalId`: UUID string.
  - `amount`: Number (positive for allocations, negative for reductions), max 2 decimals.
  - `allocationDate`: Optional ISO 8601 date string.
  - `note`: Optional string up to 500 characters.

### 2. State Management (`@expense-tracker/state`)

- **`useGoalStore` (`packages/state/src/goal-store.ts`)**:
  - `goals`: Array of `Goal` domain records.
  - `allocations`: Map of `goalId -> totalAllocatedAmount`.
  - `allocationsHistory`: Array of granular `GoalAllocation` audit records.
  - **Invariant Enforcement**: `allocateToGoal(goalId, amount, note, date, currentBankBalance)` rejects any allocation that would cause `totalAllocations > currentBankBalance`.
  - **Reductions**: `reduceFromGoal(goalId, amount, note, date)` validates and records reduction entries without going below zero.
  - **Selectors**: `getGoalsWithProgress()`, `getAllocationsForGoal(goalId)`, `getTotalAllocations()`.

### 3. User Interface & Modals (`apps/web`)

- **`CreateGoalModal` (`apps/web/src/components/modals/CreateGoalModal.tsx`)**:
  - Creation modal with name, target amount, deadline, and description with full validation.
- **`EditGoalModal` (`apps/web/src/components/modals/EditGoalModal.tsx`)**:
  - Editing modal with name, target amount, deadline, description, and status controls.
- **`GoalAllocationModal` (`apps/web/src/components/modals/GoalAllocationModal.tsx`)**:
  - Interactive modal supporting both **Allocate Funds (+)** and **Reduce Funds (-)** tabs.
  - Real-time display of unallocated cash balance, max allocatable amount, current goal balance, and error hints for invariant violations.
- **`GoalHistoryModal` (`apps/web/src/components/modals/GoalHistoryModal.tsx`)**:
  - Chronological audit ledger of all allocations and reductions for a specific goal with deletion capabilities.
- **`GoalsSection` (`apps/web/src/components/dashboard/GoalsSection.tsx`)**:
  - Modern dashboard section displaying goal cards with progress bars, remaining target amounts, status badges, and action menus (Allocate, History, Edit, Delete).

### 4. Desktop and Mobile Parity

- **Desktop (`apps/desktop`)**: Clean desktop integration of goals with progress tracking and store access.
- **Mobile (`apps/mobile`)**: `GoalsProgress.tsx` component providing real-time progress bars, amounts saved, and target metrics.

## Testing & Verification

- Comprehensive unit tests in `packages/state/tests/state-stores.test.ts` testing goal creation, updates, deletions with cascade, allocation additions, balance invariant enforcement, reductions, and allocation history deletion.
- Validated with 0 errors across `scripts/validate.sh` (TypeScript, ESLint, Prettier, Vitest, Pytest).
