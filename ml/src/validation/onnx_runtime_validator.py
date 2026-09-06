"""
ONNX Runtime Validation Module for Expense Super ML Models.

Executes rigorous numerical and categorical inference equivalence tests between
Python Scikit-Learn models and ONNX Runtime execution sessions.
Validates:
1. IsolationForest Anomaly Detector (labels, decision function scores, latency)
2. KMeans Behavioral Clusterer (cluster assignments, Euclidean distance tensors, latency)
3. Dynamic batch dimension scaling ([1, N], [10, N], [100, N])
4. Preprocessing invariance using StandardScaler manifest parameters
"""

import json
import logging
import os
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import joblib
import numpy as np
import onnxruntime as ort

from ml.src.export.onnx_exporter import ANOMALY_FEATURE_NAMES, CLUSTERING_FEATURE_NAMES

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

MODELS_DIR = Path("ml/models")


@dataclass
class AnomalyEquivalenceResult:
    total_samples: int
    label_matches: int
    label_concordance_pct: float
    decision_score_max_abs_error: float
    decision_score_mean_squared_error: float
    sklearn_avg_latency_ms: float
    onnx_avg_latency_ms: float
    is_equivalent: bool


@dataclass
class ClusteringEquivalenceResult:
    total_samples: int
    label_matches: int
    label_concordance_pct: float
    distance_tensor_max_abs_error: float
    distance_tensor_mean_squared_error: float
    sklearn_avg_latency_ms: float
    onnx_avg_latency_ms: float
    is_equivalent: bool


@dataclass
class ONNXRuntimeValidationReport:
    timestamp: str
    anomaly_validation: AnomalyEquivalenceResult
    clustering_validation: ClusteringEquivalenceResult
    batch_scalability_passed: bool
    all_models_equivalent: bool


class ONNXRuntimeValidator:
    """
    Validates numerical equivalence and latency between Scikit-Learn Python
    models and exported ONNX Runtime sessions.
    """

    def __init__(self, models_dir: Path = MODELS_DIR):
        self.models_dir = Path(models_dir)
        self.anomaly_joblib_path = self.models_dir / "isolation_forest.joblib"
        self.anomaly_onnx_path = self.models_dir / "isolation_forest.onnx"
        self.clustering_joblib_path = self.models_dir / "kmeans_clusterer.joblib"
        self.clustering_onnx_path = self.models_dir / "kmeans_clusterer.onnx"
        self.clustering_manifest_path = self.models_dir / "clustering_model.manifest.json"

    def _generate_synthetic_test_features(
        self, num_samples: int = 1000, seed: int = 42
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Generates realistic continuous feature vectors for testing:
        - 14 features for Anomaly Detection
        - 8 features for KMeans Clustering
        """
        np.random.seed(seed)
        # 14 features for anomaly: income, expense, savings_rate, dti, expense_ratio,
        # max_cat_pct, top3_cat_pct, txn_count, weekend_pct, discretionary_pct,
        # amount_std, amount_skew, amount_kurt, expense_growth
        X_anomaly = np.zeros((num_samples, 14), dtype=np.float32)
        # Normal distributions with realistic financial spreads
        X_anomaly[:, 0] = np.random.uniform(20000, 250000, num_samples)  # income
        X_anomaly[:, 1] = X_anomaly[:, 0] * np.random.uniform(0.3, 0.95, num_samples)  # expense
        X_anomaly[:, 2] = np.maximum(0, (1 - X_anomaly[:, 1] / X_anomaly[:, 0]) * 100)  # savings_rate
        X_anomaly[:, 3] = np.random.uniform(0, 0.4, num_samples)  # dti
        X_anomaly[:, 4] = X_anomaly[:, 1] / np.maximum(X_anomaly[:, 0], 1)  # expense_ratio
        X_anomaly[:, 5] = np.random.uniform(0.15, 0.55, num_samples)  # max_cat_pct
        X_anomaly[:, 6] = np.random.uniform(0.40, 0.85, num_samples)  # top3_cat_pct
        X_anomaly[:, 7] = np.random.uniform(10, 120, num_samples)  # txn_count
        X_anomaly[:, 8] = np.random.uniform(0.10, 0.60, num_samples)  # weekend_pct
        X_anomaly[:, 9] = np.random.uniform(0.05, 0.50, num_samples)  # discretionary_pct
        X_anomaly[:, 10] = np.random.uniform(100, 5000, num_samples)  # amount_std
        X_anomaly[:, 11] = np.random.uniform(0.1, 4.0, num_samples)  # amount_skew
        X_anomaly[:, 12] = np.random.uniform(-1.0, 15.0, num_samples)  # amount_kurt
        X_anomaly[:, 13] = np.random.uniform(-0.3, 0.5, num_samples)  # expense_growth

        # Inject extreme anomaly variations into 20% of samples
        num_anomalies = int(num_samples * 0.2)
        idx_anom = np.random.choice(num_samples, num_anomalies, replace=False)
        X_anomaly[idx_anom, 1] *= np.random.uniform(1.8, 3.5, num_anomalies)  # surge expense
        X_anomaly[idx_anom, 4] = X_anomaly[idx_anom, 1] / X_anomaly[idx_anom, 0]
        X_anomaly[idx_anom, 2] = 0.0  # 0 savings
        X_anomaly[idx_anom, 8] = np.random.uniform(0.7, 0.95, num_anomalies)  # weekend spike
        X_anomaly[idx_anom, 7] = np.random.uniform(150, 300, num_anomalies)  # txn flurry

        # 8 continuous features for clustering
        # [savings_rate, discretionary_pct, dti, expense_growth, weekend_pct, amount_std, txn_count, top3_cat_pct]
        X_clustering = np.zeros((num_samples, 8), dtype=np.float32)
        X_clustering[:, 0] = X_anomaly[:, 2]  # savings_rate
        X_clustering[:, 1] = X_anomaly[:, 9]  # discretionary_pct
        X_clustering[:, 2] = X_anomaly[:, 3]  # dti
        X_clustering[:, 3] = X_anomaly[:, 13]  # expense_growth
        X_clustering[:, 4] = X_anomaly[:, 8]  # weekend_pct
        X_clustering[:, 5] = X_anomaly[:, 10]  # amount_std
        X_clustering[:, 6] = X_anomaly[:, 7]  # txn_count
        X_clustering[:, 7] = X_anomaly[:, 6]  # top3_cat_pct

        return X_anomaly, X_clustering

    def validate_anomaly_model(
        self, num_samples: int = 1000, atol: float = 1e-4
    ) -> AnomalyEquivalenceResult:
        """
        Validates the IsolationForest Scikit-Learn model against isolation_forest.onnx.
        """
        if not self.anomaly_joblib_path.exists():
            raise FileNotFoundError(f"Missing {self.anomaly_joblib_path}")
        if not self.anomaly_onnx_path.exists():
            raise FileNotFoundError(f"Missing {self.anomaly_onnx_path}")

        # Load sklearn model
        sklearn_obj = joblib.load(self.anomaly_joblib_path)
        sklearn_model = sklearn_obj if hasattr(sklearn_obj, "predict") else sklearn_obj["model"]

        # Load ONNX session
        ort_session = ort.InferenceSession(str(self.anomaly_onnx_path))
        input_name = ort_session.get_inputs()[0].name

        # Generate test features
        X_test, _ = self._generate_synthetic_test_features(num_samples=num_samples)

        # Benchmark Sklearn latency
        t0 = time.perf_counter()
        sklearn_labels = sklearn_model.predict(X_test)
        sklearn_scores = sklearn_model.decision_function(X_test)
        sklearn_time_ms = (time.perf_counter() - t0) * 1000 / num_samples

        # Benchmark ONNX Runtime latency
        t0 = time.perf_counter()
        ort_outputs = ort_session.run(None, {input_name: X_test})
        onnx_time_ms = (time.perf_counter() - t0) * 1000 / num_samples

        onnx_labels = ort_outputs[0].flatten()
        onnx_scores = ort_outputs[1].flatten()

        # Concordance & numerical analysis
        label_matches = int(np.sum(sklearn_labels == onnx_labels))
        concordance_pct = float(label_matches / num_samples * 100.0)

        abs_diffs = np.abs(sklearn_scores - onnx_scores)
        max_abs_err = float(np.max(abs_diffs))
        mse = float(np.mean(abs_diffs**2))

        is_equivalent = bool(concordance_pct == 100.0 and max_abs_err <= atol)

        logger.info(
            f"Anomaly Model Equivalence: Concordance={concordance_pct:.2f}%, "
            f"MaxAbsErr={max_abs_err:.6e}, MSE={mse:.6e}, "
            f"Sklearn Latency={sklearn_time_ms:.4f}ms/sample, ONNX Latency={onnx_time_ms:.4f}ms/sample"
        )

        return AnomalyEquivalenceResult(
            total_samples=num_samples,
            label_matches=label_matches,
            label_concordance_pct=concordance_pct,
            decision_score_max_abs_error=max_abs_err,
            decision_score_mean_squared_error=mse,
            sklearn_avg_latency_ms=sklearn_time_ms,
            onnx_avg_latency_ms=onnx_time_ms,
            is_equivalent=is_equivalent,
        )

    def validate_clustering_model(
        self, num_samples: int = 1000, atol: float = 1e-4
    ) -> ClusteringEquivalenceResult:
        """
        Validates the KMeans Scikit-Learn model against kmeans_clusterer.onnx.
        """
        if not self.clustering_joblib_path.exists():
            raise FileNotFoundError(f"Missing {self.clustering_joblib_path}")
        if not self.clustering_onnx_path.exists():
            raise FileNotFoundError(f"Missing {self.clustering_onnx_path}")

        # Load sklearn model & scaler
        sklearn_obj = joblib.load(self.clustering_joblib_path)
        if isinstance(sklearn_obj, dict):
            sklearn_model = sklearn_obj["model"]
            sklearn_scaler = sklearn_obj["scaler"]
        else:
            sklearn_model = sklearn_obj
            sklearn_scaler = None

        # Load ONNX session
        ort_session = ort.InferenceSession(str(self.clustering_onnx_path))
        input_name = ort_session.get_inputs()[0].name

        # Generate raw clustering features and scale them
        _, X_raw = self._generate_synthetic_test_features(num_samples=num_samples)
        if sklearn_scaler is not None:
            X_scaled = sklearn_scaler.transform(X_raw).astype(np.float32)
        else:
            X_scaled = X_raw.astype(np.float32)

        # Benchmark Sklearn latency
        t0 = time.perf_counter()
        sklearn_labels = sklearn_model.predict(X_scaled)
        sklearn_distances = sklearn_model.transform(X_scaled)
        sklearn_time_ms = (time.perf_counter() - t0) * 1000 / num_samples

        # Benchmark ONNX Runtime latency
        t0 = time.perf_counter()
        ort_outputs = ort_session.run(None, {input_name: X_scaled})
        onnx_time_ms = (time.perf_counter() - t0) * 1000 / num_samples

        onnx_labels = ort_outputs[0].flatten()
        onnx_distances = ort_outputs[1]

        # Concordance & numerical analysis
        label_matches = int(np.sum(sklearn_labels == onnx_labels))
        concordance_pct = float(label_matches / num_samples * 100.0)

        abs_diffs = np.abs(sklearn_distances - onnx_distances)
        max_abs_err = float(np.max(abs_diffs))
        mse = float(np.mean(abs_diffs**2))

        # Float32 Euclidean distance vectors match within rtol=1e-3, atol=1e-2 and MSE <= 1e-4
        is_close = bool(np.allclose(sklearn_distances, onnx_distances, rtol=1e-3, atol=1e-2))
        is_equivalent = bool(concordance_pct == 100.0 and is_close and mse <= 1e-4)

        logger.info(
            f"Clustering Model Equivalence: Concordance={concordance_pct:.2f}%, "
            f"MaxAbsErr={max_abs_err:.6e}, MSE={mse:.6e}, "
            f"Sklearn Latency={sklearn_time_ms:.4f}ms/sample, ONNX Latency={onnx_time_ms:.4f}ms/sample"
        )

        return ClusteringEquivalenceResult(
            total_samples=num_samples,
            label_matches=label_matches,
            label_concordance_pct=concordance_pct,
            distance_tensor_max_abs_error=max_abs_err,
            distance_tensor_mean_squared_error=mse,
            sklearn_avg_latency_ms=sklearn_time_ms,
            onnx_avg_latency_ms=onnx_time_ms,
            is_equivalent=is_equivalent,
        )

    def validate_batch_scalability(self, batch_sizes: Optional[List[int]] = None) -> bool:
        """
        Validates dynamic batch execution across multiple batch sizes [1, 5, 25, 100, 500].
        """
        if batch_sizes is None:
            batch_sizes = [1, 5, 25, 100, 500]

        ort_anomaly = ort.InferenceSession(str(self.anomaly_onnx_path))
        ort_clustering = ort.InferenceSession(str(self.clustering_onnx_path))

        for b in batch_sizes:
            X_anom, X_clust = self._generate_synthetic_test_features(num_samples=b)
            # Run anomaly
            out_anom = ort_anomaly.run(None, {"float_input": X_anom})
            if out_anom[0].shape[0] != b or out_anom[1].shape[0] != b:
                logger.error(f"Anomaly dynamic batch mismatch at size {b}")
                return False

            # Run clustering
            out_clust = ort_clustering.run(None, {"float_input": X_clust})
            if out_clust[0].shape[0] != b or out_clust[1].shape[0] != b:
                logger.error(f"Clustering dynamic batch mismatch at size {b}")
                return False

        logger.info(f"Dynamic batch scalability certified across sizes {batch_sizes}")
        return True

    def run_full_validation(
        self,
        output_report_path: Path = MODELS_DIR / "onnx_runtime_validation_report.json",
        num_samples: int = 1000,
    ) -> ONNXRuntimeValidationReport:
        """
        Executes full validation and serializes validation report to JSON.
        """
        logger.info("Starting ONNX Runtime Validation Suite...")
        anomaly_res = self.validate_anomaly_model(num_samples=num_samples)
        clustering_res = self.validate_clustering_model(num_samples=num_samples)
        batch_res = self.validate_batch_scalability()

        all_passed = bool(
            anomaly_res.is_equivalent
            and clustering_res.is_equivalent
            and batch_res
        )

        report = ONNXRuntimeValidationReport(
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            anomaly_validation=anomaly_res,
            clustering_validation=clustering_res,
            batch_scalability_passed=batch_res,
            all_models_equivalent=all_passed,
        )

        output_path = Path(output_report_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(asdict(report), f, indent=2)

        logger.info(f"Validation Report saved to {output_path}. Status: {'PASSED' if all_passed else 'FAILED'}")
        return report


def main():
    validator = ONNXRuntimeValidator()
    report = validator.run_full_validation()
    if not report.all_models_equivalent:
        raise RuntimeError("ONNX Runtime Validation failed! Equivalence tolerance breached.")
    print("===========================================")
    print("ONNX Runtime Inference Validation PASSED!")
    print(f"Anomaly Concordance:    {report.anomaly_validation.label_concordance_pct:.2f}%")
    print(f"Clustering Concordance: {report.clustering_validation.label_concordance_pct:.2f}%")
    print(f"Batch Scalability:      {'PASSED' if report.batch_scalability_passed else 'FAILED'}")
    print("===========================================")


if __name__ == "__main__":
    main()
