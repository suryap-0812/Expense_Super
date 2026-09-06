# Phase 23: Unified Dashboard

## Overview

Phase 23 implements the single unified, responsive financial command center across Web, Desktop (Tauri), Tablet, and Mobile (Expo) in strict adherence to Sections 6 and 82 of `.agent/mater_prompt.md`.

## Core Invariants & Rules

- **Single Primary Dashboard (Section 6 & 82)**: The application features one unified dashboard avoiding fragmented multi-page navbar navigation.
- **Top 5 Required Metrics**:
  1. **Bank Balance**: Authoritative manual verified balance with Edit and History audit log workflows.
  2. **Available to Spend**: Real-time unallocated cash ($$\text{Bank Balance} - \text{Total Goal Allocations}$$).
  3. **Received (Inflow)**: Total verified income for the selected period.
  4. **Spent (Outflow)**: Total verified expense transactions for the selected period.
  5. **Net Savings & Savings Rate**: Net cash flow ($$\text{Income} - \text{Expenses}$$) with color-coded savings rate percentage badge.
- **Cohesive Analytical & Operational Modules**:
  - Income vs Expense Monthly Timeline with comparative double bars and MoM change indicators.
  - Spending by Category Distribution with custom gradient visual progress indicators.
  - Spending Trends & Behavioral Diagnostics (Weekend spending ratio, transaction velocity, active days, volatility CV).
  - Active Savings Goals with real-time target progress, Allocate/Reduce funds, and Audit History modals.
  - Behavioral ML Insights (K-Means Persona, Isolation Forest Anomaly Detection, Evidence-backed Structured Insights).
  - Full-featured Recent Transactions Ledger with search, period filtering, sorting, Add, Edit, and Delete modal workflows.
  - AI Financial Advisor card for proactive budget coaching and natural language query previews.
- **Responsive Adaptability**:
  - **Desktop ($>1024\text{px}$)**: 12-column grid layout (7-col analytical left / 5-col behavioral right / 12-col transaction ledger).
  - **Tablet ($768\text{px}-1024\text{px}$)**: Fluid 2-column and stacked card layouts.
  - **Mobile ($<768\text{px}$)**: Full-width stacked cards and touch-optimized data views.

## Key Deliverables

### 1. Web Dashboard (`apps/web`)

- **`SummaryCards.tsx` (`apps/web/src/components/dashboard/SummaryCards.tsx`)**:
  - Renders the 5 primary top metrics (`Bank Balance`, `Available to Spend`, `Received`, `Spent`, `Net Savings`) with live store bindings.
- **`SpendingTrendsSection.tsx` (`apps/web/src/components/dashboard/SpendingTrendsSection.tsx`)**:
  - Displays monthly income vs expense comparative bars, net savings, MoM trend direction, and expense volatility coefficient of variation.
- **`AnalyticsSection.tsx` (`apps/web/src/components/dashboard/AnalyticsSection.tsx`)**:
  - Category spending progress bars with transaction count, percentage breakdown, and behavioral weekend/velocity diagnostics.
- **`App.tsx` & `index.css` (`apps/web/src/`)**:
  - Complete dashboard grid, modal state integration, and responsive styling.

### 2. Desktop Dashboard Parity (`apps/desktop`)

- **`DesktopDashboardView.tsx` (`apps/desktop/src/components/DesktopDashboardView.tsx`)**:
  - 5-metric summary row, behavioral persona card, active goals progress, and recent transactions table with desktop glassmorphic design.

### 3. Mobile Dashboard Parity (`apps/mobile`)

- **`SummaryCards.tsx` (`apps/mobile/src/components/SummaryCards.tsx`)**:
  - 5-card mobile grid featuring Bank Balance, Available to Spend, Inflow, Outflow, and Net Savings with savings rate badge.

## Testing & Verification

- Validated across all 15 Vitest test files (119 unit tests) and 50 Python tests via `scripts/validate.sh`.
- TypeScript typecheck verified cleanly across all 11 workspace packages and applications.
