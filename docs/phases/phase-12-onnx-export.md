# Phase 12 — ONNX Model Export & Manifest Certification

## 1. Overview

Phase 12 implements the production-grade ONNX model export and metadata manifest generation pipeline for all trained Machine Learning models conforming to **Master Specification Section 31 and Section 71**.

The exported models provide client-side inference capability across:

1. **Desktop Applications** (Tauri + Rust / C++ / Node.js ONNX Runtime bindings)
2. **Web Applications** (React + Vite using `onnxruntime-web` WebAssembly execution provider)
3. **Mobile Applications** (React Native using `onnxruntime-react-native` mobile execution provider)
4. **Backend / Analytics Services** (Python ONNX Runtime CPU execution provider)

---

## 2. Artifact Separation & Storage

All compiled model binaries and metadata manifests are stored strictly in the dedicated `ml/models/` artifact directory, separate from application source code:

| Artifact File                                                                                                                                     | Description                               | Format   | Size    |
| :------------------------------------------------------------------------------------------------------------------------------------------------ | :---------------------------------------- | :------- | :------ |
| [`ml/models/isolation_forest.onnx`](file:///home/surya/Project_dir/Expense_super/ml/models/isolation_forest.onnx)                                 | Anomaly detection model (100 trees)       | ONNX v15 | ~787 KB |
| [`ml/models/anomaly_detection_model.manifest.json`](file:///home/surya/Project_dir/Expense_super/ml/models/anomaly_detection_model.manifest.json) | Anomaly detector input/output manifest    | JSON     | ~2.5 KB |
| [`ml/models/kmeans_clusterer.onnx`](file:///home/surya/Project_dir/Expense_super/ml/models/kmeans_clusterer.onnx)                                 | Persona clustering model ($K=6$)          | ONNX v15 | ~871 B  |
| [`ml/models/clustering_model.manifest.json`](file:///home/surya/Project_dir/Expense_super/ml/models/clustering_model.manifest.json)               | Clustering input/output & scaler manifest | JSON     | ~3.4 KB |
| [`ml/models/onnx_models_manifest.json`](file:///home/surya/Project_dir/Expense_super/ml/models/onnx_models_manifest.json)                         | Consolidated master bundle manifest       | JSON     | ~9.3 KB |

---

## 3. Model 1: Isolation Forest Anomaly Detector

### 3.1 Model Metadata

- **Model Name**: `isolation_forest_anomaly_detector`
- **Model Version**: `1.0.0`
- **Schema Version**: `1.0`
- **Target Opset**: 15 (`ai.onnx.ml` v3)
- **Algorithm**: Isolation Forest (100 estimators, $5\%$ contamination rate)

### 3.2 Input Schema

- **Input Node Name**: `"float_input"`
- **Tensor Type**: `tensor(float)` (`float32`)
- **Tensor Shape**: `["None", 14]` (Dynamic batch dimension)
- **Feature Vector (Strict Order)**:
  1. `savings_rate` (float32): Net savings percentage `(income - expense) / income * 100`
  2. `expense_volatility` (float32): Coefficient of variation of monthly expenses
  3. `income_volatility` (float32): Coefficient of variation of monthly income
  4. `average_monthly_expense` (float32): Mean monthly expenditure in INR
  5. `average_monthly_income` (float32): Mean monthly income in INR
  6. `food_ratio` (float32): Proportion of expenses in Food category `[0.0, 1.0]`
  7. `shopping_ratio` (float32): Proportion of expenses in Shopping category `[0.0, 1.0]`
  8. `transport_ratio` (float32): Proportion of expenses in Transport category `[0.0, 1.0]`
  9. `bills_ratio` (float32): Proportion of expenses in Bills category `[0.0, 1.0]`
  10. `discretionary_ratio` (float32): Proportion of discretionary expenses `[0.0, 1.0]`
  11. `weekend_spending_ratio` (float32): Proportion of expenses on Friday–Sunday `[0.0, 1.0]`
  12. `largest_transaction_ratio` (float32): Ratio of largest transaction to total expense `[0.0, 1.0]`
  13. `transaction_frequency` (float32): Average number of transactions per month
  14. `category_spending_entropy` (float32): Shannon entropy of categorical spending distribution

### 3.3 Output Schema

1. **`label`** (`tensor(int64)`, shape `["None", 1]`):
   - `1`: Normal consumer inlier
   - `-1`: Outlier / Anomalous spending behavior
2. **`scores`** (`tensor(float)`, shape `["None", 1]`):
   - Raw decision function score. Negative values denote high anomaly likelihood.
   - Calibrated into probability score via: $P(\text{anomaly}) = \frac{1}{1 + e^{12 \times \text{score}}}$.

### 3.4 Preprocessing Requirements

- **Normalization**: None (Decision tree splits operate directly on original calibrated feature values).
- **Missing Values**: Impute `NaN` with `0.0`.
- **Minimum Data Gate**: $\ge 10$ transactions and $\ge 1$ active calendar month.

---

## 4. Model 2: K-Means Behavioral Persona Clusterer

### 4.1 Model Metadata

- **Model Name**: `kmeans_persona_clusterer`
- **Model Version**: `1.0.0`
- **Schema Version**: `1.0`
- **Target Opset**: 15 (`ai.onnx.ml` v3)
- **Algorithm**: K-Means ($K=6$ clusters)

### 4.2 Input Schema

- **Input Node Name**: `"float_input"`
- **Tensor Type**: `tensor(float)` (`float32`)
- **Tensor Shape**: `["None", 8]` (Dynamic batch dimension)
- **Feature Vector (Strict Order)**:
  1. `savings_rate`
  2. `expense_volatility`
  3. `transaction_frequency`
  4. `food_ratio`
  5. `shopping_ratio`
  6. `weekend_spending_ratio`
  7. `average_monthly_income`
  8. `average_monthly_expense`

### 4.3 Output Schema

1. **`label`** (`tensor(int64)`, shape `["None", 1]`):
   - Cluster index `[0..5]` mapping directly to financial persona archetype badges:
     - `0`: Disciplined High Saver
     - `1`: Food & Dining Heavy
     - `2`: Discretionary Overspender
     - `3`: Weekend Lifestyle Spender
     - `4`: Irregular Volatile Budgeter
     - `5`: Balanced Everyday Consumer
2. **`distances`** (`tensor(float)`, shape `["None", 6]`):
   - Euclidean distances from the sample to all 6 persona centroid vectors.

### 4.4 Preprocessing Requirements

- **Standardization Required**: Features must be z-score standardized before feeding into the ONNX session:
  $$x_{\text{scaled}} = \frac{x - \mu}{\sigma}$$
- **Exact Scaler Parameters (Stored in Manifest)**:
  - `savings_rate`: $\mu = 16.0510, \sigma = 20.3425$
  - `expense_volatility`: $\mu = 0.1986, \sigma = 0.1319$
  - `transaction_frequency`: $\mu = 32.0461, \sigma = 6.0541$
  - `food_ratio`: $\mu = 0.2404, \sigma = 0.0746$
  - `shopping_ratio`: $\mu = 0.1682, \sigma = 0.0883$
  - `weekend_spending_ratio`: $\mu = 0.3741, \sigma = 0.1028$
  - `average_monthly_income`: $\mu = 53334.0060, \sigma = 8192.4138$
  - `average_monthly_expense`: $\mu = 43955.1574, \sigma = 9288.9094$

---

## 5. Runtime & Operational Assumptions

1. **ONNX Runtime Minimum Version**: `1.15.0+` (compatible with `onnxruntime`, `onnxruntime-web`, `onnxruntime-react-native`).
2. **Execution Providers**:
   - Web / Browser: `WasmExecutionProvider` (`wasm` backend with SIMD support).
   - Desktop / Mobile / Server: `CPUExecutionProvider`.
3. **Thread Safety**: Model sessions are read-only and thread-safe for concurrent evaluations across multiple accounts.
4. **Memory Footprint**: Total combined memory footprint for both models is $< 1.2\text{ MB}$.
5. **Dynamic Batching**: Fully supports single-item real-time transaction scoring `[1, 14]` as well as batch historical evaluation `[N, 14]`.

---

## 6. Execution & Verification

```bash
# Export and validate all models to ONNX and generate manifests
pnpm run ml:export:onnx

# Run ML test suite (45 tests)
pnpm run ml:test

# Run full monorepo validation suite (127 tests)
./scripts/validate.sh
```
