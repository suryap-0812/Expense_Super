# Machine Learning & Statistical Pipeline Reference — Expense Tracker V1

## 1. Overview & Separation of Concerns

Expense Tracker V1 uses Machine Learning exclusively as an **evidence generator**, not a calculator or final decision maker.

- **What ML Does**: Identifies multi-dimensional spending anomalies, detects sudden spikes in discretionary categories, extracts behavioral profiles (e.g. "Good Saver", "Weekend Spender", "Impulse Spender"), and computes volatility indices.
- **What ML Never Does**: Authoritative calculations of balance, savings rate, available to spend, or financial advice.

---

## 2. Python ML Training Pipeline (`ml/src/`)

```text
Synthetic Generator (10,000 users, 10 profiles, 12 months)
        │
        ▼
Feature Engineering (18 behavioral & temporal features)
        │
        ├── Isolation Forest (Anomaly Detection, scikit-learn)
        │       │
        │       ▼
        │   ONNX Export (Float32 tensor input, score/label output)
        │
        └── K-Means Clustering (Behavioral Grouping, k=4)
                │
                ▼
            ONNX Export (Feature vector input, cluster ID output)
```

---

## 3. ONNX Model Specifications

1. **`ml/models/isolation_forest.onnx`**:
   - **Input**: `float_input` (Shape: `[batch_size, 18]`, Type: `FLOAT32`)
   - **Outputs**: `label` (Int64: `1` for normal, `-1` for anomaly), `probabilities` (Float32 decision function anomaly score).
2. **`ml/models/kmeans_cluster.onnx`**:
   - **Input**: `float_input` (Shape: `[batch_size, 8]`, Type: `FLOAT32`)
   - **Outputs**: `label` (Int64 cluster index: `0` to `3`), `distances` (Float32 euclidean distances to cluster centroids).

---

## 4. TypeScript Inference Engine (`packages/ml-inference/`)

In the Node, Desktop, and Web clients, ONNX inference runs locally via the `@expense-tracker/ml-inference` wrapper without requiring Python:

- Features are extracted from client transactions deterministically in < 60ms for 1,000 transactions.
- Inference tensors are constructed and passed to ONNX Runtime session (`onnxruntime-node` or `onnxruntime-web`).
- Structured ML Output schema (`ZodMLOutputSchema`) validates every anomaly prediction before consumption by UI or LLM client.
