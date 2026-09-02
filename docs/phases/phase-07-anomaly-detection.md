# Phase 7: Anomaly Detection (Isolation Forest) Report

## Objective

Train, evaluate, benchmark, and export an **Isolation Forest** model to detect unusual financial behavior from behavioral feature matrices (Sections 23, 27, 28, and 66 of the Master Technical Specification). The model is exported to **ONNX** with verified numerical parity against scikit-learn for zero-Python local client inference.

---

## 1. Model Configuration & Architecture

| Parameter         | Specification                      | Purpose                                                              |
| :---------------- | :--------------------------------- | :------------------------------------------------------------------- |
| **Model Type**    | `sklearn.ensemble.IsolationForest` | Tree-based unsupervised anomaly detection via path length isolation. |
| **Estimators**    | 100 trees                          | High ensemble stability and variance reduction.                      |
| **Contamination** | 0.05 (5.0%)                        | Calibrated against observed synthetic behavioral anomalies.          |
| **Random State**  | 42                                 | Full deterministic reproducibility.                                  |
| **Export Format** | ONNX (`ai.onnx.ml` v3, Opset 15)   | Cross-platform runtime inference via ONNX Runtime without Python.    |

---

## 2. Feature Schema & Population Baselines

Trained on 10,000 users ($N = 10,000$) using the following 14 behavioral features extracted in Phase 5:

| Feature Name                | Population Mean ($\mu$) | Population Std ($\sigma$) | Description                                                          |
| :-------------------------- | :---------------------- | :------------------------ | :------------------------------------------------------------------- |
| `savings_rate`              | 16.05%                  | 20.34%                    | Net savings percentage of income.                                    |
| `expense_volatility`        | 0.1986                  | 0.1319                    | Month-over-month coefficient of variation.                           |
| `income_volatility`         | 0.0515                  | 0.1259                    | Volatility in monthly cash inflows.                                  |
| `average_monthly_expense`   | ₹43,955.16              | ₹9,288.91                 | Baseline monthly living expenditure.                                 |
| `average_monthly_income`    | ₹53,334.01              | ₹8,192.41                 | Baseline monthly income level.                                       |
| `food_ratio`                | 24.04%                  | 7.46%                     | Food & dining share of total expenses.                               |
| `shopping_ratio`            | 16.82%                  | 8.83%                     | Retail & discretionary goods share.                                  |
| `transport_ratio`           | 10.35%                  | 3.55%                     | Fuel, transit, and commute share.                                    |
| `bills_ratio`               | 18.12%                  | 6.14%                     | Utilities, rent, and recurring bill commitments.                     |
| `discretionary_ratio`       | 53.47%                  | 8.92%                     | Aggregate non-essential expenditure.                                 |
| `weekend_spending_ratio`    | 37.41%                  | 10.28%                    | Weekend vs. weekday expenditure concentration.                       |
| `largest_transaction_ratio` | 4.57%                   | 2.32%                     | Outlier single purchase magnitude relative to total monthly expense. |
| `transaction_frequency`     | 32.05                   | 6.05                      | Monthly transaction velocity count.                                  |
| `category_spending_entropy` | 1.997                   | 0.096                     | Shannon entropy of spending distribution across categories.          |

---

## 3. Evaluation & Validation Results

- **Predicted Anomaly Count**: 500 / 10,000 (5.0% calibration).
- **Decision Function Score Range**: $[-0.1845, +0.1455]$ (Mean: $+0.0736$).
- **Profile-Specific Anomaly Rates**:
  - `Variable Income`: **18.24%** (highest flagged due to erratic pay cycles)
  - `Good Saver`: **8.88%** (isolated on the opposite spectrum due to unusually disciplined ultra-high savings)
  - `Goal-Oriented Saver`: **7.04%**
  - `Overspender`: **4.31%**
  - `Irregular Spender`: **2.56%**
  - `Food Heavy`: **2.24%**
  - `Impulse Spender`: **1.89%**
  - `Weekend Spender`: **1.77%**
  - `Consistent Spender`: **0.71%** (lowest anomaly rate; textbook baseline consumer)

---

## 4. ONNX Export & Inference Parity Verification

In accordance with Section 27:

> _"Validate that inference results are sufficiently equivalent."_

- **Tooling**: `skl2onnx` with `FloatTensorType` input tensor `[None, 14]`.
- **Parity Test**: Evaluated across scikit-learn and `onnxruntime.InferenceSession`.
  - Label Agreement: **100% exact match** (`np.testing.assert_array_equal`).
  - Score Agreement: **100% match within tolerance** ($\le 10^{-4}$ tolerance).
- **Artifacts Generated**:
  - `ml/models/isolation_forest.joblib` (Python training checkpoint)
  - `ml/models/isolation_forest.onnx` (production ONNX binary)
  - `ml/models/anomaly_model_metadata.json` (versioned parameters, baselines, metrics)

---

## 5. Inference Engine & Contract Integration

Implemented in `ml/src/models/anomaly_detector.py`:

- Calibrates continuous decision function into an anomaly probability score in $[0, 1]$:
  $$\text{Score} = \frac{1}{1 + e^{12 \cdot \text{decision\_score}}}$$
- Maps scores to severity tiers:
  - $\ge 0.85$: `"critical"`
  - $\ge 0.65$: `"high"`
  - $\ge 0.50$: `"medium"`
  - $\ge 0.35$: `"low"`
  - $< 0.35$: `"info"`
- Identifies and ranks top 3 **contributing features** using population baseline z-score deviations:
  $$z_i = \frac{|x_i - \mu_i|}{\sigma_i}$$
- Emits structured output strictly adhering to `MLInsightItemSchema` (Section 29).

---

## 6. Automated Test Coverage

- `ml/tests/test_anomaly.py`:
  - `test_train_anomaly_model_and_onnx_export`: Validates end-to-end training, joblib dump, ONNX conversion, and metadata persistence.
  - `test_anomaly_detector_inference_and_parity`: Validates score calibration, classification agreement between joblib and ONNX, and discrimination between disciplined savers and extreme overspenders.
- **Total Workspace Tests**: **92 passed** (68 TypeScript vitest + 24 Python pytest).
- **Typecheck**: 0 errors across all workspace projects.
- **ESLint & Prettier**: 0 errors/warnings.
- **Monorepo Validation**: `./scripts/validate.sh` PASSED.
