# Phase 11 — ML Validation & Scenario Benchmarks

## 1. Overview

Phase 11 implements comprehensive scenario benchmarking and robustness validation for the Machine Learning intelligence pipeline conforming to **Master Specification Section 30 and Section 70**.

The goal of this phase is to rigorously certify the detection capabilities of the Isolation Forest anomaly detector, statistical pattern analysis, and evidence-backed structured ML output against:

1. **Controlled Behavioral Anomalies**: 5 distinct injected anomaly scenarios (`SPENDING_ANOMALY`, `CATEGORY_INCREASE`, `SAVINGS_DECLINE`, `WEEKEND_SPIKE`, `FREQUENCY_BURST`).
2. **Normal Consumer Streams**: Disciplined baseline savers (`GOOD_SAVER`, `CONSISTENT_SPENDER`, `GOAL_ORIENTED_SAVER`).
3. **Noise Perturbation Robustness**: Gaussian noise injection at 5%, 10%, and 20% standard deviations.
4. **Documented Failure Boundary Modes**: Explicit handling of edge cases (cold start, single pay-cycle volatility, symmetric inflows, lifestyle inflation).

---

## 2. Benchmark Architecture & Workflow

The validation engine is implemented in [`ml/src/validation/ml_scenario_validator.py`](file:///home/surya/Project_dir/Expense_super/ml/src/validation/ml_scenario_validator.py).

```
Normal / Disciplined Savers        Controlled Anomaly Cohorts (5 Types)
  (Good Saver, Consistent Spender)   (Spikes, Surges, Deficits, Bursts)
               │                                      │
               ▼                                      ▼
     ┌────────────────────────────────────────────────────────┐
     │           Synthetic Scenario Dataset Generator         │
     │      (Target 3-Month Window, Profile Allocations)      │
     └─────────────────────────┬──────────────────────────────┘
                               │
                               ▼
     ┌────────────────────────────────────────────────────────┐
     │      Temporal Preprocessor & 28-Feature Pipeline       │
     └─────────────────────────┬──────────────────────────────┘
                               │
                               ▼
     ┌────────────────────────────────────────────────────────┐
     │        Dual ML Intelligence & Pattern Evaluation       │
     │  - Isolation Forest Outlier Inference (ONNX Calibrated)│
     │  - Structured Evidence-Backed Insight Engine           │
     └─────────────────────────┬──────────────────────────────┘
                               │
                               ▼
     ┌────────────────────────────────────────────────────────┐
     │             Certification & Metric Analysis            │
     │   - Confusion Matrix (TP, FP, TN, FN)                  │
     │   - Precision, Recall (>=85%), FPR (<=10%), F1, ROC-AUC │
     │   - Noise Perturbation Invariance Testing (5%-20%)     │
     │   - Export to `models/ml_validation_report.json`       │
     └────────────────────────────────────────────────────────┘
```

---

## 3. Controlled Scenario Verification Matrix

| Scenario Type                | Anomaly Signature                                         | Expected ML Detection Signal                                           | Detection Rate                           | Status     |
| :--------------------------- | :-------------------------------------------------------- | :--------------------------------------------------------------------- | :--------------------------------------- | :--------- |
| **Normal Baseline (`NONE`)** | Disciplined savings, stable category distribution         | Normal status, low anomaly score ($\le 0.50$), 0 critical alerts       | **99.58%** specificity (FPR = **0.42%**) | **PASSED** |
| **`SPENDING_ANOMALY`**       | Single massive transaction ($\ge 50\%$ monthly income)    | Isolation Forest outlier score $\ge 0.60$ + `spending_anomaly` insight | **100.0%** recall                        | **PASSED** |
| **`CATEGORY_INCREASE`**      | Extreme category surge ($300\%+$ increase, $\ge ₹15,000$) | `category_increase` insight with delta $\%$ and absolute INR surge     | **100.0%** recall                        | **PASSED** |
| **`SAVINGS_DECLINE`**        | Severe deficit burn ($135\%$ expense-to-income ratio)     | `savings_decline` insight + negative savings rate alert                | **100.0%** recall                        | **PASSED** |
| **`WEEKEND_SPIKE`**          | Extreme weekend concentration ($\ge 75\%$ Friday-Sunday)  | `weekend_concentration` insight with weekend spend ratio               | **100.0%** recall                        | **PASSED** |
| **`FREQUENCY_BURST`**        | Rapid microtransaction flurry ($\ge 7$ tx/day)            | `transaction_burst` insight with velocity evidence                     | **100.0%** recall                        | **PASSED** |

---

## 4. Benchmark Validation Report

The validated results exported to [`ml/models/ml_validation_report.json`](file:///home/surya/Project_dir/Expense_super/ml/models/ml_validation_report.json):

```json
{
  "timestamp": "2026-09-03T07:41:12.512980+00:00",
  "validation_phase": "Phase 11: ML Validation",
  "model_type": "Isolation Forest (100 estimators, 5% contamination)",
  "benchmark_dataset": {
    "dataset_size": 480,
    "normal_samples": 240,
    "anomalous_samples": 240,
    "confusion_matrix": {
      "true_negatives": 239,
      "false_positives": 1,
      "false_negatives": 0,
      "true_positives": 240
    },
    "metrics": {
      "precision": 0.9959,
      "recall": 1.0,
      "false_positive_rate": 0.0042,
      "false_negative_rate": 0.0,
      "specificity": 0.9958,
      "f1_score": 0.9979,
      "roc_auc": 1.0
    }
  },
  "noise_robustness": {
    "noise_sigma_5pct": {
      "noise_std_dev": 0.05,
      "label_stability_rate": 0.9904,
      "status": "robust"
    },
    "noise_sigma_10pct": {
      "noise_std_dev": 0.1,
      "label_stability_rate": 0.9254,
      "status": "robust"
    },
    "noise_sigma_20pct": {
      "noise_std_dev": 0.2,
      "label_stability_rate": 0.7204,
      "status": "sensitive"
    }
  },
  "validation_passed": true
}
```

---

## 5. Noise Robustness & Perturbation Invariance

Feature stability was evaluated by adding Gaussian noise $\mathcal{N}(0, \sigma^2 \cdot \text{std}(X))$ to all 28 feature inputs:

- **5% Perturbation ($\sigma = 0.05$)**: **99.04%** label stability (Robust)
- **10% Perturbation ($\sigma = 0.10$)**: **92.54%** label stability (Robust)
- **20% Perturbation ($\sigma = 0.20$)**: **72.04%** label stability (Moderate degradation as expected under heavy 20% distortion)

---

## 6. Documented Limitations & Edge-Case Boundaries

1. **Cold-Start Data Sparsity ($< 10$ Transactions)**:
   - _Behavior_: Model inference is suppressed and `data_quality.sufficient_data` is set to `False`.
   - _Mitigation_: Fallback to deterministic financial analytics until minimum 10 transactions accumulate.
2. **Single Pay-Cycle Volatility ($< 2$ Months)**:
   - _Behavior_: Users with 1 month of history cannot compute month-over-month trends (OLS trend returns `None`).
   - _Mitigation_: Requires $\ge 2$ distinct calendar months before emitting linear trajectory insights.
3. **Symmetric Inflows / Sudden Bonusing**:
   - _Behavior_: A massive legitimate bonus (e.g. ₹500,000) causes income volatility and high largest-transaction ratio.
   - _Mitigation_: Structured output explains contributing feature is income-driven rather than an alarming spending deficit.
4. **Gradual Creeping Lifestyle Inflation**:
   - _Behavior_: Unsupervised Isolation Forest detects point/subspace outliers rather than slow secular 2% monthly lifestyle inflation.
   - _Mitigation_: Detected by deterministic OLS trend analyzer (`spending_trend` slope $> 0$).

---

## 7. Verification Commands

```bash
# Run scenario benchmark suite and generate models/ml_validation_report.json
pnpm run ml:validate:scenarios

# Run full ML pytest suite (41 tests)
pnpm run ml:test

# Run entire repository validation suite (123 tests across TS and Python)
./scripts/validate.sh
```
