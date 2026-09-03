# Phase 10: Structured ML Output Report

## Objective

Implement versioned, evidence-backed Structured ML Output payload generators conforming to **Section 29** and **Section 69** of the Master Technical Specification across TypeScript (`@expense-tracker/ml-contract`) and Python (`ml/src/export/`), guaranteeing strict Zod schema validation and verifiable quantitative evidence for zero-hallucination downstream UI and AI grounding.

---

## 1. Schema Specifications (Section 29 & 69)

| Output Field         | Type                                | Description                                                                                                                       |
| :------------------- | :---------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| `schema_version`     | String (`"1.0"`)                    | Explicit contract version for migration resilience.                                                                               |
| `period`             | String (`"YYYY-MM"` / `"all-time"`) | Granular timeframe identifier for the insight batch.                                                                              |
| `generated_at`       | String (ISO-8601)                   | Timestamp of payload construction.                                                                                                |
| `data_quality`       | Object                              | `transaction_count`, `active_days`, `coverage_months`, `sufficient_data` ($\ge 10$ txs), `data_quality_score` ($0\text{--}100$).  |
| `summary`            | Object                              | Authoritative deterministic indicators: income, expense, savings, savings rate, volatility rating, top category, trend direction. |
| `persona` (Optional) | Object                              | Supplementary behavioral archetype badge (`Disciplined High Saver`, `Overspender`, etc.) and confidence.                          |
| `insights[]`         | Array<Object>                       | Granular evidence-backed insight items.                                                                                           |

---

## 2. Evidence-Backed Structured Insight Types

Every insight item enforces a mandatory quantitative `evidence` sub-object ensuring strict mathematical grounding:

| Insight Type            | Trigger Condition                                                | Severity Tier                                    | Structured Quantitative Evidence                                                                   |
| :---------------------- | :--------------------------------------------------------------- | :----------------------------------------------- | :------------------------------------------------------------------------------------------------- |
| `spending_anomaly`      | Isolation Forest $P(\text{anomaly}) \ge 0.50$                    | `medium`, `high`, `critical`                     | Primary driver feature, observed value, baseline population mean ($\mu$), and $z$-score deviation. |
| `category_increase`     | MoM growth $\ge +15\%$ & absolute $\ge ₹1,000$                   | `medium` ($15\text{--}50\%$), `high` ($>50\%$)   | Current expenditure, previous baseline expenditure, percentage growth.                             |
| `category_decline`      | MoM decline $\le -15\%$ & absolute $\le -₹1,000$                 | `low`                                            | Current expenditure, previous baseline expenditure, percentage contraction.                        |
| `savings_decline`       | Savings OLS slope $\le -₹1,000/\text{mo}$                        | `high`                                           | Monthly slope decay rate, percentage delta, month sample size.                                     |
| `savings_growth`        | Savings OLS slope $\ge +₹1,000/\text{mo}$                        | `info`                                           | Monthly slope velocity rate, month sample size.                                                    |
| `weekend_concentration` | Weekend expenditure share $\ge 45\%$                             | `low` ($45\text{--}55\%$), `medium` ($\ge 55\%$) | Weekend ratio, expected baseline (28.6%), percentage premium vs. weekday ticket size.              |
| `high_volatility`       | Volatility rating `"high"` or `"volatile"`                       | `medium` ($CV \ge 0.30$), `high` ($CV \ge 0.50$) | Coefficient of Variation ($CV$), baseline threshold (0.15).                                        |
| `transaction_burst`     | Daily transaction volume $\ge 2\times \text{velocity}$ & $\ge 3$ | `low`, `medium` ($\ge 6\text{ tx/day}$)          | Burst date, daily count, average daily velocity baseline.                                          |

---

## 3. Implementation Architecture

### TypeScript Implementation (`@expense-tracker/ml-contract`)

- **Location**: `packages/ml-contract/`
- **Dependencies**: `@expense-tracker/domain`, `@expense-tracker/schemas`, `@expense-tracker/analytics`, `zod`.
- **Files**:
  - `src/types.ts`: TypeScript contracts for `MLDataQualityMetrics`, `MLInsightEvidence`, `StructuredMLInsight`, `MLBehavioralPersona`, and `StructuredMLOutputPayload`.
  - `src/generator.ts`: Pure functional generator with Zod validation.
  - `src/index.ts`: Module entry point.
  - `tests/ml-output.test.ts`: 4 comprehensive unit tests verifying data quality, category shifts, anomaly integration, and flurry detection.

### Python Parity Implementation (`ml/src/export/`)

- **Location**: `ml/src/export/`
- **Files**:
  - `ml_output_generator.py`: Mirror implementation for batch pipelines, model evaluation, and LLM prompt grounding.
  - `__init__.py`: Module entry point.
  - `ml/tests/test_ml_output.py`: 3 Pytest unit tests confirming mathematical parity with TypeScript.

---

## 4. Validation & Test Coverage

- **Vitest Suite**: **82 passed** across workspace (4 ML contract, 10 pattern analysis, 13 financial analytics, 24 schemas, 24 domain, 7 foundation).
- **Pytest Suite**: **36 passed** across ML workspace (3 ML output, 2 clustering, 7 pattern analysis, 7 financial analytics, 2 anomaly, 6 features, 6 generator, 2 validation, 1 placeholder).
- **Total Automated Tests**: **118 passed (100%)**.
- **TypeScript Typecheck**: 0 errors across all 8 workspace projects (`pnpm run typecheck`).
- **ESLint & Prettier**: 0 errors/warnings.
- **Monorepo Validation**: `./scripts/validate.sh` PASSED.
