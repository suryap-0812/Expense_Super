# Database Architecture & Persistence Strategy — Expense Tracker V1

## 1. Relational Database Overview

Expense Tracker V1 uses **SQLite 3** as its authoritative, local-first persistent data store across all client platforms:

- **Desktop (Tauri)**: `tauri-plugin-sql` (`sqlite:expense_tracker.db` in app data directory)
- **Mobile (Expo)**: `expo-sqlite` (`expense_tracker.db` in document directory)
- **Web / In-Memory (Node / Vitest)**: `better-sqlite3` or memory adapter for headless testing & browser SQLite (WASM/OPFS).

---

## 2. Schema Definition & Tables

```sql
-- 1. Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  amount REAL NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  date TEXT NOT NULL, -- ISO-8601 YYYY-MM-DDTHH:mm:ss.sssZ
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);

-- 2. Bank Balance Records Table
CREATE TABLE IF NOT EXISTS bank_balances (
  id TEXT PRIMARY KEY,
  balance REAL NOT NULL CHECK (balance >= 0),
  recorded_at TEXT NOT NULL,
  note TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bank_balances_recorded_at ON bank_balances(recorded_at);

-- 3. Financial Goals Table
CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  target_amount REAL NOT NULL CHECK (target_amount > 0),
  target_date TEXT,
  category TEXT DEFAULT 'general',
  color TEXT DEFAULT '#3B82F6',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Goal Allocations Table (Reservations of current bank balance)
CREATE TABLE IF NOT EXISTS goal_allocations (
  id TEXT PRIMARY KEY,
  goal_id TEXT NOT NULL,
  amount REAL NOT NULL CHECK (amount >= 0),
  allocated_at TEXT NOT NULL,
  note TEXT DEFAULT '',
  FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_allocations_goal_id ON goal_allocations(goal_id);
```

---

## 3. Database Invariants & Business Rules

1. **Authoritative Balance Invariant**: Current bank balance is manually entered and authoritative. The formula `Initial Balance + SUM(txs) = Current Balance` is intentionally not enforced because external unrecorded transactions may occur.
2. **Allocation Solvency Invariant**: `SUM(goal_allocations.amount) <= Current Bank Balance`. Allocations exceeding bank balance are rejected at both Zod validation and store layers.
3. **Immutability of Historical Sync**: Transaction deletions and updates are isolated within SQLite transactions (`BEGIN TRANSACTION ... COMMIT`).
