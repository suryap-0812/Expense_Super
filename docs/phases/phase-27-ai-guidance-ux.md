# Phase 27: AI Guidance UX

## 1. Executive Summary

Phase 27 implements the **AI Guidance UX** conforming strictly to **Master Specification Section 86** and Sections 34-37. It presents natural language financial explanations, proactive budget coaching, and actionable recommendations derived from local deterministic analytics and ML inference models.

A core tenet of this phase is transparency and grounding:

- The UI renders all **5 mandatory fields** for every finding:
  1. **Finding Title**: Headline summary of the financial insight.
  2. **Evidence**: Grounded metric comparison displaying observed values, baseline values, and delta percentages in monospace font.
  3. **Explanation**: Clear context on why this pattern impacts overall financial health.
  4. **Recommendation**: Specific, actionable guidance to optimize cash flow and savings buffers.
  5. **Priority**: Visual priority indicators (`high`, `medium`, `low`).
- The UI introduces a **3-tier Provenance Badging Architecture** that prevents confusion between deterministic facts, ML inferences, and LLM advice:
  - 🟢 **`Calculated`**: Deterministic arithmetic totals, savings rate, averages.
  - 🟣 **`ML Detected`**: Local ONNX IsolationForest anomaly, K-Means clustering persona.
  - 🔵 **`LLM Suggested`**: Natural language guidance and proactive suggestions from OpenRouter.
- **Strict Grounding Guarantee**: LLMs are never permitted to recalculate or alter deterministic totals.

---

## 2. Implemented Architecture & Components

### 2.1 Reusable UI Design System (`packages/ui`)

- [`ProvenanceBadge.tsx`](file:///home/surya/Project_dir/Expense_super/packages/ui/src/ProvenanceBadge.tsx):
  - 3-tier badging system with specific color coding and semantic icons:
    - `calculated`: Green/emerald badge (`#10b981`, calculator icon)
    - `ml_detected`: Purple/indigo badge (`#8b5cf6`, CPU chip icon)
    - `llm_suggested`: Cyan/blue badge (`#06b6d4`, sparkles icon)
- [`GuidanceFindingCard.tsx`](file:///home/surya/Project_dir/Expense_super/packages/ui/src/GuidanceFindingCard.tsx):
  - Card rendering all 5 mandatory fields with distinct visual sections:
    - Finding header with priority badge and provenance tier.
    - Grounded Evidence box (`finding-evidence`, `num-mono`).
    - Explanation & Context description block.
    - Actionable Recommendation highlight container.
- Exported via `packages/ui/src/index.ts`.

### 2.2 Web Application Integration (`apps/web`)

- [`AIAdvisorSection.tsx`](file:///home/surya/Project_dir/Expense_super/apps/web/src/components/dashboard/AIAdvisorSection.tsx):
  - Connected to reactive `useGuidanceStore`.
  - Interactive "Refresh Guidance" trigger with spinning indicator during generation.
  - Model indicator badge (`activeModel`, e.g., `anthropic/claude-3.5-sonnet`) and timestamp metadata.
  - Priority filter pills (`All`, `High`, `Medium`, `Low`).
  - Executive summary banner.
  - Grounding guarantee disclaimer banner.

### 2.3 Desktop Application Integration (`apps/desktop`)

- [`DesktopDashboardView.tsx`](file:///home/surya/Project_dir/Expense_super/apps/desktop/src/components/DesktopDashboardView.tsx):
  - Full AI Financial Guidance card integrated into desktop grid view alongside behavioral personas and goals.
  - Interactive generation button and finding cards with provenance badges.

### 2.4 Mobile Application Integration (`apps/mobile`)

- [`AIGuidanceCard.tsx`](file:///home/surya/Project_dir/Expense_super/apps/mobile/src/components/AIGuidanceCard.tsx):
  - Native React Native card supporting 5-field findings, 3-tier provenance chips, executive summary, and refresh trigger.
- Wired into [`apps/mobile/src/App.tsx`](file:///home/surya/Project_dir/Expense_super/apps/mobile/src/App.tsx).

---

## 3. Verification & Validation

1. **Unit & Component Testing**:
   - `packages/ui/tests/guidance-finding-card.test.tsx`: Validates 5 mandatory fields and 3-tier provenance rendering.
   - `apps/web/tests/ai-advisor-section.test.tsx`: Validates ready state, executive summary, findings display, and interactive triggers.
2. **Full Workspace Validation (`scripts/validate.sh`)**:
   - 13 packages compiled & typechecked without errors (`tsc --noEmit`).
   - ESLint and Prettier passed without warnings.
   - 21 Vitest test suites (144 unit & integration tests) passing 100%.
   - 50 Pytest ML test suites passing 100%.
