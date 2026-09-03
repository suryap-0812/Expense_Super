"""
Automated unit tests for Behavioral Clustering (K-Means) experimenter and ONNX parity.
"""

import os
import tempfile
import numpy as np
import pandas as pd
import pytest

from ml.src.models.clustering import (
    BehavioralClusterExperimenter,
    CLUSTERING_FEATURES,
)


@pytest.fixture
def synthetic_clustering_features():
    """Generates synthetic dataset for testing clustering sweeps."""
    with tempfile.TemporaryDirectory() as tmpdir:
        n_samples = 300
        rng = np.random.RandomState(42)

        data = {
            "user_id": [f"user_{i}" for i in range(n_samples)],
            "profile": ["Good Saver"] * 100 + ["Overspender"] * 100 + ["Weekend Spender"] * 100,
            "savings_rate": np.concatenate([rng.normal(45, 5, 100), rng.normal(-25, 8, 100), rng.normal(15, 5, 100)]),
            "expense_volatility": np.concatenate([rng.normal(0.1, 0.02, 100), rng.normal(0.15, 0.03, 100), rng.normal(0.35, 0.05, 100)]),
            "transaction_frequency": rng.uniform(20, 45, n_samples),
            "food_ratio": rng.uniform(0.15, 0.35, n_samples),
            "shopping_ratio": np.concatenate([rng.uniform(0.05, 0.15, 100), rng.uniform(0.30, 0.55, 100), rng.uniform(0.10, 0.20, 100)]),
            "weekend_spending_ratio": np.concatenate([rng.uniform(0.20, 0.35, 100), rng.uniform(0.30, 0.45, 100), rng.uniform(0.55, 0.75, 100)]),
            "average_monthly_income": rng.normal(55000, 5000, n_samples),
            "average_monthly_expense": rng.normal(45000, 6000, n_samples),
        }

        df = pd.DataFrame(data)
        feat_path = os.path.join(tmpdir, "clustering_features.parquet")
        df.to_parquet(feat_path, index=False)

        yield feat_path, tmpdir


def test_kmeans_experiment_sweep(synthetic_clustering_features):
    """Verifies that K-Means sweeps K=2..5 and produces valid cluster metrics."""
    feat_path, tmpdir = synthetic_clustering_features
    models_dir = os.path.join(tmpdir, "models")

    experimenter = BehavioralClusterExperimenter(
        features_path=feat_path,
        models_dir=models_dir,
        random_state=42,
    )

    report = experimenter.run_experiment(k_range=(2, 5))

    assert report["model_type"] == "KMeans"
    assert report["n_samples"] == 300
    assert len(report["results_by_k"]) == 4  # K=2, 3, 4, 5

    for k_str, metrics in report["results_by_k"].items():
        assert -1.0 <= metrics["silhouette_score"] <= 1.0
        assert metrics["davies_bouldin_index"] >= 0.0
        assert metrics["cluster_stability_ari"] >= 0.70
        assert metrics["profile_separation_ari"] is not None

    assert os.path.exists(report["artifacts"]["joblib_path"])
    assert os.path.exists(report["artifacts"]["onnx_path"])
    assert len(report["personas_interpreted"]) == report["optimal_k"]


def test_kmeans_onnx_inference_parity(synthetic_clustering_features):
    """Verifies exact prediction agreement between scikit-learn and ONNX Runtime."""
    feat_path, tmpdir = synthetic_clustering_features
    models_dir = os.path.join(tmpdir, "models")

    experimenter = BehavioralClusterExperimenter(
        features_path=feat_path,
        models_dir=models_dir,
        random_state=42,
    )
    report = experimenter.run_experiment(k_range=(3, 4))

    import onnxruntime as ort

    onnx_path = report["artifacts"]["onnx_path"]
    sess = ort.InferenceSession(onnx_path)

    # Generate test feature matrix
    test_raw = np.array([
        [50.0, 0.08, 22.0, 0.20, 0.05, 0.25, 60000.0, 30000.0],  # Disciplined Saver
        [-30.0, 0.15, 45.0, 0.15, 0.45, 0.40, 45000.0, 58000.0], # Overspender
        [15.0, 0.35, 30.0, 0.20, 0.15, 0.65, 52000.0, 44000.0],  # Weekend Spender
    ], dtype=np.float32)

    test_scaled = experimenter.scaler.transform(test_raw).astype(np.float32)

    sklearn_preds = experimenter.best_model.predict(test_scaled)
    ort_outputs = sess.run(None, {"float_input": test_scaled})
    ort_preds = ort_outputs[0].flatten()

    np.testing.assert_array_equal(ort_preds, sklearn_preds)
