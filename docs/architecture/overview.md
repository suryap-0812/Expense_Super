# Architecture Overview

## Core System Architecture

Expense Tracker V1 is a local-first application designed for single-user personal finance management.

### Key Tenets

1. **Local-First & Offline-First:** No central application backend server. SQLite is the primary database on desktop and mobile; IndexedDB/local storage or in-memory SQLite on web.
2. **Authoritative Manual Bank Balance:** Bank balance is directly updated by the user and represents ground truth. The system does not assume `Calculated Balance == Bank Balance` because unrecorded transactions, fees, and transfers occur in the real world.
3. **Deterministic Financial Engine:** All critical financial calculations (net savings, savings rate, total income, total expense, goal fulfillment, and "Available to Spend") are computed deterministically in pure TypeScript with zero external dependencies.
4. **Local ML Intelligence:** Anomaly detection and behavioral clustering run locally via ONNX Runtime without sending sensitive raw transaction data to third parties.
5. **AI Guidance Layer:** An external LLM (via OpenRouter) receives only aggregated, privacy-sanitized metrics and summaries to provide explanatory guidance.

### Package Responsibilities

- `@expense-tracker/domain`: Financial entities, value objects, and business invariant rules.
- `@expense-tracker/schemas`: Zod schemas validating transactions, goals, settings, ML features, and LLM payloads.
- `@expense-tracker/state`: Zustand client state stores binding local adapters with UI reactive states.
- `@expense-tracker/analytics`: Deterministic metrics calculations, rolling windows, and savings tracking.
- `@expense-tracker/ml-contract`: Type-safe interfaces matching the Python ML pipeline features and outputs.
- `@expense-tracker/ui`: Shared design tokens and UI components.
- `@expense-tracker/utils`: Currency formatting, mathematical utilities, and date manipulation helpers.
