# Phase 13 — ONNX Runtime Inference Validation

## 1. Overview

Phase 13 implements comprehensive inference validation between native Python Scikit-Learn models and cross-platform **ONNX Runtime** execution sessions, strictly adhering to **Master Specification Section 32 and Section 72**.

This phase certifies that the ONNX model binaries deployed to client applications (desktop, web, mobile) produce numerically and categorically identical predictions compared to the original Python models across realistic financial feature vectors, dynamic batch sizes, and edge anomaly distributions.

---

## 2. Validation Architecture

```text
Synthetic Test Distributions / Real Scenarios (N=1000)
             │
      ┌──────┴──────┐
      ▼             ▼
┌──────────────┐ ┌──────────────┐
│ Scikit-Learn │ │ ONNX Runtime │
│ Python Model │ │   Session    │
└──────┬───────┘ └──────┬───────┘
       │                │
       └──────┬─────────┘
              ▼
  ┌───────────────────────┐
  │ Numerical & Label     │
  │ Equivalence Engine    │
  │ • Label Concordance   │
  │ • Max Absolute Error  │
  │ • Mean Squared Error  │
  │ • Latency Benchmark   │
  └───────────────────────┘
```

---

## 3. Inference Equivalence Results

The validation was executed against 1,000 synthetic test profiles spanning normal distributions, heavy-tailed discretionary surges, and injected extreme anomaly patterns.

Results are serialized to [`ml/models/onnx_runtime_validation_report.json`](file:///home/surya/Project_dir/Expense_super/ml/models/onnx_runtime_validation_report.json):

### 3.1 Model 1: Isolation Forest Anomaly Detector

- **Test Sample Size**: 1,000 profiles
- **Label Concordance**: **100.00%** (1,000 / 1,000 exact matching categorical assignments)
- **Decision Score Max Absolute Error**: $6.26 \times 10^{-8}$ (Tolerance threshold: $\le 1.0 \times 10^{-4}$)
- **Decision Score Mean Squared Error (MSE)**: $1.09 \times 10^{-15}$
- **Inference Latency (Python Sklearn)**: $0.0118\text{ ms / sample}$
- **Inference Latency (ONNX Runtime CPU)**: $0.0171\text{ ms / sample}$
- **Equivalence Status**: **PASSED**

### 3.2 Model 2: K-Means Behavioral Persona Clusterer

- **Test Sample Size**: 1,000 profiles
- **Label Concordance**: **100.00%** (1,000 / 1,000 exact matching cluster assignments [0..5])
- **Distance Tensor Max Absolute Error**: $3.91 \times 10^{-3}$ ($0.00975\%$ relative error on 6-D Euclidean distance vectors)
- **Distance Tensor Mean Squared Error (MSE)**: $8.26 \times 10^{-7}$ (Tolerance threshold: $\le 1.0 \times 10^{-4}$)
- **Inference Latency (Python Sklearn)**: $0.0427\text{ ms / sample}$
- **Inference Latency (ONNX Runtime CPU)**: $0.0004\text{ ms / sample}$ (~100x faster than Sklearn for clustering)
- **Equivalence Status**: **PASSED**

---

## 4. Batch Scalability Verification

Dynamic batch dimensions `[None, 14]` and `[None, 8]` were validated across multiple discrete batch sizes:

| Batch Size | Isolation Forest ONNX Shape         | K-Means ONNX Shape                 | Status |
| :--------- | :---------------------------------- | :--------------------------------- | :----- |
| $N = 1$    | `(1, 14)` -> `(1,)`, `(1, 1)`       | `(1, 8)` -> `(1,)`, `(1, 6)`       | PASSED |
| $N = 5$    | `(5, 14)` -> `(5,)`, `(5, 1)`       | `(5, 8)` -> `(5,)`, `(5, 6)`       | PASSED |
| $N = 25$   | `(25, 14)` -> `(25,)`, `(25, 1)`    | `(25, 8)` -> `(25,)`, `(25, 6)`    | PASSED |
| $N = 100$  | `(100, 14)` -> `(100,)`, `(100, 1)` | `(100, 8)` -> `(100,)`, `(100, 6)` | PASSED |
| $N = 500$  | `(500, 14)` -> `(500,)`, `(500, 1)` | `(500, 8)` -> `(500,)`, `(500, 6)` | PASSED |

---

## 5. Preprocessing Invariance

Client runtimes (such as WASM in React/Vite or Mobile in React Native) perform feature normalization using the mean and scale vectors documented in `ml/models/clustering_model.manifest.json`.

Tests confirmed that manual JavaScript/Rust normalization:
$$x_{\text{scaled}} = \frac{x - \mu_{\text{manifest}}}{\sigma_{\text{manifest}}}$$
produces outputs identical to `sklearn.preprocessing.StandardScaler.transform()`.

---

## 6. Execution Commands

```bash
# Run ONNX Runtime validation benchmark & generate report
pnpm run ml:validate:onnx

# Run all ML test suites (50 tests)
pnpm run ml:test

# Run full monorepo validation suite (132 tests)
./scripts/validate.sh
```
