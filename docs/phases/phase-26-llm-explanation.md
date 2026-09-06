# Phase 26 — LLM Explanation System

Phase 26 implements the authoritative financial explanation generation engine that transforms structured ML evidence into human-readable, grounded explanations conforming to **Master Specification Section 85 (Phase 26), Section 35 (LLM Input), Section 36 (LLM Output), and Section 37 (LLM Safety Rules)**.

---

## 1. Architectural Pipeline

```text
Structured ML Result (FinancialAnalysisResult)
             │
             ▼
FinancialExplanationService (explain)
             │
    ┌────────┴────────┐
    ▼                 ▼
Cold Start Check   LLM Client Execution (OpenRouterClient / MockLLMClient)
(Acknowledge setup)   │
                      ▼
            Schema Validation (parseLLMResponseSafe)
                      │
                      ▼
            useGuidanceStore (Zustand)
                      │
                      ▼
            Structured 4-Facet Findings:
            1. What happened (Title)
            2. Why it matters (Explanation)
            3. Evidence (Observed metric & delta)
            4. Possible action (Recommendation)
```

---

## 2. Core Capabilities & 4-Facet Contract

For every financial finding emitted by the AI guidance layer, the system strictly produces:

1. **What happened**: Clear, concise finding headline (e.g., `"Healthy Savings Discipline"`).
2. **Why it matters**: Economic contextualization of why this impact affects financial stability and long-term targets.
3. **Evidence**: Grounded numerical metric with baseline and percentage delta (e.g., `"Net savings reached ₹45,000 with a 37.5% savings rate"`).
4. **Possible action**: Concrete, constructive recommendation tailored to the user's budget.

### Non-Calculation Mandate (Section 33 & 37)

- The explanation system never acts as a calculation engine.
- All numbers, summaries, and totals are computed deterministically by `@expense-tracker/analytics` and passed as grounded evidence.

---

## 3. State Store Integration

Implemented in [`packages/state/src/guidance-store.ts`](file:///home/surya/Project_dir/Expense_super/packages/state/src/guidance-store.ts):

- `useGuidanceStore` provides reactive tracking of:
  - `guidanceResult`: Active validated findings and executive summary.
  - `isGenerating`: Loading state indicator during remote generation.
  - `error`: Error state string (with automatic offline fallback).
  - `lastGeneratedAt`: Timestamp of last successful analysis.
  - `activeModel`: Underlying model used (e.g., `anthropic/claude-3.5-sonnet` or `mock/deterministic-guidance-engine`).

---

## 4. Verification Suite

1. **[`packages/llm-client/tests/explanation-service.test.ts`](file:///home/surya/Project_dir/Expense_super/packages/llm-client/tests/explanation-service.test.ts)**:
   - Verifies 4-facet finding extraction and structure.
   - Verifies cold-start handling ($<10$ transactions) without hallucinated trends.
   - Verifies transparent offline fallback when remote API calls fail.
2. **[`packages/state/tests/guidance-store.test.ts`](file:///home/surya/Project_dir/Expense_super/packages/state/tests/guidance-store.test.ts)**:
   - Verifies Zustand store state transitions, generation lifecycle, and reset actions.
