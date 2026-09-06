# Phase 14 — ML Inference Package & Application Interface

## 1. Overview

Phase 14 implements the decoupled, application-facing Machine Learning and Financial Analytics interface conforming strictly to **Master Technical Specification Section 32 (Cold Start) and Section 73 (Phase 14 — ML Interface)**.

The primary objective is to present a clean, high-level, and unified TypeScript contract:

```ts
export interface FinancialAnalysisEngine {
  analyze(input: FinancialAnalysisInput): Promise<FinancialAnalysisResult>;
}
```

This abstraction completely decouples upstream UI frameworks (React, Vite, Tauri, React Native) and state management layers from internal ML mechanics, ONNX tensor allocations, feature extraction algorithms, and heuristic rule engines.

---

## 2. Architecture & Data Flow

```text
Application Layer (React / Vite / Zustand / Tauri / React Native)
                         │
                         ▼
           FinancialAnalysisEngine.analyze()
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
 Cold Start (< 10 txns)          Sufficient Data (≥ 10 txns)
        │                                 │
        ▼                                 ├─► Feature Extraction (14-dim & 8-dim)
 Deterministic Baseline Stats             ├─► StandardScaler Normalization
 Basic Income/Expense Ratios              ├─► ONNX Inference Session (Isolation Forest & KMeans)
 Degraded Evidence Reporting             └─► Fallback Heuristic Pattern Analysis
        │                                 │
        └────────────────┬────────────────┘
                         ▼
           FinancialAnalysisResult
           • Data Quality Metrics (coldStart flag & score)
           • Deterministic Financial Summary
           • Behavioral Persona Archetype (0..5)
           • Calibrated Spending Anomaly Insights
           • Zod-Validated StructuredMLOutputPayload (for LLM & UI)
```

---

## 3. Core Components

### 3.1 Interface & Contracts ([`packages/ml-contract/src/types.ts`](file:///home/surya/Project_dir/Expense_super/packages/ml-contract/src/types.ts))

- **`FinancialAnalysisInput`**:
  - `transactions`: Readonly array of financial transactions.
  - `period`: Optional analysis period string (`"YYYY-MM"` or `"all-time"`).
  - `savingsGoalAmount`: Optional financial target.
  - `options`: Execution flags (e.g. `disableML`, `anomalyThreshold`).
- **`FinancialAnalysisResult`**:
  - `schemaVersion`: Version string (`"1.0"`).
  - `period`: Active evaluation timeframe.
  - `generatedAt`: ISO 8601 timestamp.
  - `dataQuality`: Evaluates data sufficiency (`sufficientData`, `coldStart`, `dataQualityScore`).
  - `summary`: Total income, expense, net savings, savings rate, and volatility rating.
  - `persona`: Archetype title, cluster ID `0..5`, description, and confidence score.
  - `anomaly`: Anomaly detection status, probability score `[0, 1]`, and severity rating.
  - `insights`: Evidence-backed structured insights.
  - `structuredPayload`: Full Zod `MLOutputContractSchema`-validated payload.
  - `executionMetadata`: Engine execution runtime type (`"onnx" | "rule_based" | "hybrid"`) and duration in milliseconds.

### 3.2 Engine Implementation ([`packages/ml-contract/src/engine.ts`](file:///home/surya/Project_dir/Expense_super/packages/ml-contract/src/engine.ts))

- **`extractAnomalyFeatures(transactions)`**:
  - Extracts 14 continuous behavioral dimensions matching `ml/models/isolation_forest.onnx`.
- **`extractClusteringFeatures(transactions)`**:
  - Extracts and normalizes 8 continuous behavioral dimensions using manifest `StandardScaler` parameters matching `ml/models/kmeans_clusterer.onnx`.
- **`HybridFinancialAnalysisEngine`**:
  - Accepts optional `ONNXInferenceSessionProvider`.
  - Executes ONNX inference sessions if provider is present and data is sufficient.
  - Gracefully falls back to robust rule-based heuristics if ONNX inference fails or is disabled.
  - Enforces Cold Start constraints per Section 32.
- **`createFinancialAnalysisEngine()`**:
  - Factory method instantiating the default analysis engine.

---

## 4. Cold Start Handling (Section 32)

When a user has $< 10$ transactions:

1. **`sufficientData`**: Set to `false`.
2. **`coldStart`**: Set to `true`.
3. **`message`**: `"Insufficient transaction history (<10 transactions). Basic statistics provided without behavioral ML conclusions."`.
4. **Behavioral Inferences**: Complex cluster personas and deep anomaly inferences are omitted to prevent presenting weak or premature statistical evidence as fact.

---

## 5. Verification & Testing

Unit tests implemented in [`packages/ml-contract/tests/financial-analysis-engine.test.ts`](file:///home/surya/Project_dir/Expense_super/packages/ml-contract/tests/financial-analysis-engine.test.ts):

1. **Cold Start Safeties**: Verified graceful degradation on sparse histories ($< 10$ transactions).
2. **Feature Extraction Parity**: Verified 14-dim and 8-dim vectors produce finite, valid float arrays.
3. **Rule-Based Fallback Execution**: Verified persona derivation and deterministic summary generation.
4. **ONNX Provider Integration**: Verified end-to-end integration with mock ONNX sessions.
5. **Provider Resilience**: Verified error catching and hybrid fallback when ONNX sessions throw.

---

## 6. Execution Commands

```bash
# Run Vitest test suite (87 tests)
pnpm run test

# Run full monorepo validation suite (137 tests)
./scripts/validate.sh
```
