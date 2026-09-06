# Phase 15 — React + Vite Foundation & Component Architecture

## 1. Overview

Phase 15 establishes the production-grade **React + Vite** web application foundation and client-side reactive state management conforming strictly to **Master Specification Section 6 (Dashboard Requirement) and Section 74 (Phase 15 — React + Vite)**.

The architecture emphasizes:

1. **Single Unified Dashboard**: One primary, compact, information-dense, refined, Excel-inspired dashboard (NOT a multi-page navbar app, and NOT a literal spreadsheet).
2. **Modular Component Architecture**: Decomposed into focused, reusable, and cleanly separated modules (Header, SummaryCards, MLInsights, Analytics, Goals, TransactionsLedger, AIAdvisor, AddRecordModal).
3. **Reactive State Management**: Centralized Zustand state stores in `@expense-tracker/state` for transactions, analytical inferences, savings targets, and preferences.
4. **Curated Luxury Aesthetics**: Dark space glassmorphism design system (`#060911`), Outfit/Inter typography, glowing gradient badges, and responsive CSS grid.
5. **Direct ML Engine Integration**: Reactive coupling to `@expense-tracker/ml-contract`'s `FinancialAnalysisEngine`.

---

## 2. Monorepo Package & App Hierarchy

```text
apps/web/
├── index.html                                (Outfit/Inter typography, responsive viewport)
├── vite.config.ts                            (Vite 5 React configuration)
├── package.json                              (@expense-tracker/web workspace package)
└── src/
    ├── main.tsx                              (React 19 Root entry)
    ├── App.tsx                               (Main dashboard shell & reactive orchestrator)
    ├── index.css                             (Design system tokens, glassmorphism, table layout)
    ├── data/
    │   └── sample-data.ts                    (Initial demonstration transactions & goals)
    └── components/
        ├── layout/
        │   └── Header.tsx                    (Period selector, Local ML status badge, CTAs)
        ├── dashboard/
        │   ├── SummaryCards.tsx              (4 core financial metrics with trend indicators)
        │   ├── MLInsightsSection.tsx         (Behavioral persona badges, anomaly status, evidence)
        │   ├── AnalyticsSection.tsx          (Category spending breakdown bars & diagnostics)
        │   ├── GoalsSection.tsx              (Savings targets progress bars & deadlines)
        │   ├── TransactionsSection.tsx       (Excel-inspired dense filterable ledger)
        │   └── AIAdvisorSection.tsx          (LLM explanation guidance placeholder)
        └── modals/
            └── AddTransactionModal.tsx       (Zod-validated transaction entry form)
```

---

## 3. Zustand Reactive State Architecture (`@expense-tracker/state`)

- **`useTransactionStore`**:
  - State: `transactions: Transaction[]`, `filters: TransactionFilterState` (period, category, search, type, sorting).
  - Actions: `addTransaction`, `updateTransaction`, `deleteTransaction`, `setPeriod`, `setCategoryFilter`, `setTypeFilter`.
  - Selectors: `selectFilteredTransactions()`.
- **`useAnalysisStore`**:
  - State: `analysisResult: FinancialAnalysisResult | null`, `isAnalyzing: boolean`, `lastAnalyzedAt: string | null`.
  - Actions: `runAnalysis(engine, input)`.
- **`useGoalStore`**:
  - State: `goals: Goal[]`, `allocations: Record<string, number>`.
  - Actions: `addGoal`, `updateGoal`, `allocateToGoal`, `getGoalsWithProgress()`.
- **`useSettingsStore`**:
  - State: `currency: "INR"`, `theme: "dark"`, `monthlyIncomeTarget: 60000`, `savingsRateTarget: 25`.

---

## 4. Shared UI Library (`@expense-tracker/ui`)

- **`tokens.ts`**: Color palettes, glassmorphic backdrop filters, typography definitions.
- **`Button.tsx`**: `primary`, `secondary`, `glass`, `danger`, `ghost` variants with icon slot.
- **`Card.tsx`**: Glassmorphic and elevated surfaces with customizable padding.
- **`Badge.tsx`**: Status and categorical pill badges (`brand`, `success`, `danger`, `warning`, `info`, `neutral`).
- **`Modal.tsx`**: Accessible glassmorphic dialog with backdrop blur and ESC key navigation.
- **`Input.tsx`**: Form inputs with label binding, error state highlights, and helper text.

---

## 5. Verification & Testing

- Unit tests in `packages/state/tests/state-stores.test.ts` (3 tests covering transaction filtering/sorting, goals tracking, and settings updates).
- Production build certified via `pnpm run web:build` with zero bundle or type errors.
- Workspace test suite passing: **89 Vitest + 50 Pytest = 139 tests passing total**.

---

## 6. Execution Commands

```bash
# Run web development server
pnpm run web:dev

# Build web production bundle
pnpm run web:build

# Run full monorepo validation suite (139 tests)
./scripts/validate.sh
```
