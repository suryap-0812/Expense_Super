"""
Automated unit tests for Isolation Forest Anomaly Detection and ONNX inference parity.
"""

import os
import tempfile
import numpy as np
import pandas as pd
import pytest

from ml.src.models.train_anomaly import AnomalyModelTrainer, ANOMALY_FEATURE_NAMES
from ml.src.models.anomaly_detector import AnomalyDetector


@pytest.fixture
def synthetic_features_file():
    """Creates a temporary synthetic feature matrix for training tests."""
    with tempfile.TemporaryDirectory() as tmpdir:
        n_samples = 200
        rng = np.random.RandomState(42)

        data = {
            "user_id": [f"user_{i}" for i in range(n_samples)],
            "profile": ["Good Saver"] * 100 + ["Overspender"] * 100,
            "savings_rate": np.concatenate([rng.normal(45, 5, 100), rng.normal(-25, 10, 100)]),
            "expense_volatility": np.concatenate([rng.normal(0.1, 0.02, 100), rng.normal(0.4, 0.1, 100)]),
            "income_volatility": np.concatenate([rng.normal(0.01, 0.01, 100), rng.normal(0.3, 0.1, 100)]),
            "average_monthly_expense": np.concatenate([rng.normal(30000, 3000, 100), rng.normal(70000, 10000, 100)]),
            "average_monthly_income": rng.normal(55000, 5000, n_samples),
            "food_ratio": rng.uniform(0.15, 0.35, n_samples),
            "shopping_ratio": np.concatenate([rng.uniform(0.05, 0.15, 100), rng.uniform(0.35, 0.60, 100)]),
            "transport_ratio": rng.uniform(0.05, 0.15, n_samples),
            "bills_ratio": rng.uniform(0.10, 0.20, n_samples),
            "discretionary_ratio": rng.uniform(0.30, 0.70, n_samples),
            "weekend_spending_ratio": rng.uniform(0.30, 0.60, n_samples),
            "largest_transaction_ratio": rng.uniform(0.02, 0.15, n_samples),
            "transaction_frequency": rng.uniform(20, 45, n_samples),
            "category_spending_entropy": rng.uniform(1.5, 2.1, n_samples),
        }

        df = pd.DataFrame(data)
        feat_path = os.path.join(tmpdir, "test_features.parquet")
        df.to_parquet(feat_path, index=False)

        yield feat_path, tmpdir


def test_train_anomaly_model_and_onnx_export(synthetic_features_file):
    """Tests training pipeline, metric calculation, joblib persistence, and ONNX export."""
    feat_path, tmpdir = synthetic_features_file
    models_dir = os.path.join(tmpdir, "models")

    trainer = AnomalyModelTrainer(
        features_path=feat_path,
        models_dir=models_dir,
        n_estimators=30,
        contamination=0.10,
        random_state=42,
    )

    metadata = trainer.train()

    assert metadata["model_type"] == "IsolationForest"
    assert metadata["n_samples"] == 200
    assert os.path.exists(metadata["artifacts"]["joblib_path"])
    assert os.path.exists(metadata["artifacts"]["onnx_path"])
    assert metadata["validation_results"]["overspender_vs_saver_roc_auc"] > 0.55


def test_anomaly_detector_inference_and_parity(synthetic_features_file):
    """Verifies that AnomalyDetector produces valid calibrated scores and ONNX/joblib parity."""
    feat_path, tmpdir = synthetic_features_file
    models_dir = os.path.join(tmpdir, "models")

    trainer = AnomalyModelTrainer(
        features_path=feat_path,
        models_dir=models_dir,
        n_estimators=30,
        contamination=0.10,
        random_state=42,
    )
    metadata = trainer.train()

    joblib_detector = AnomalyDetector(
        model_path=metadata["artifacts"]["joblib_path"],
        metadata_path=os.path.join(models_dir, "anomaly_model_metadata.json"),
        use_onnx=False,
    )

    onnx_detector = AnomalyDetector(
        model_path=metadata["artifacts"]["onnx_path"],
        metadata_path=os.path.join(models_dir, "anomaly_model_metadata.json"),
        use_onnx=True,
    )

    # Typical normal disciplined profile
    normal_vector = {
        "savings_rate": 48.0,
        "expense_volatility": 0.08,
        "income_volatility": 0.01,
        "average_monthly_expense": 28000.0,
        "average_monthly_income": 55000.0,
        "food_ratio": 0.20,
        "shopping_ratio": 0.08,
        "transport_ratio": 0.10,
        "bills_ratio": 0.15,
        "discretionary_ratio": 0.35,
        "weekend_spending_ratio": 0.35,
        "largest_transaction_ratio": 0.03,
        "transaction_frequency": 25.0,
        "category_spending_entropy": 1.9,
    }

    joblib_res = joblib_detector.predict(normal_vector)
    onnx_res = onnx_detector.predict(normal_vector)

    # Both models should agree on normal classification
    assert joblib_res["is_anomaly"] is False
    assert onnx_res["is_anomaly"] is False
    assert abs(joblib_res["anomaly_score"] - onnx_res["anomaly_score"]) < 0.05
    assert onnx_res["severity"] in ["info", "low"]

    # Extreme anomalous profile (negative savings, 75% shopping ratio, high volatility)
    outlier_vector = {
        "savings_rate": -70.0,
        "expense_volatility": 0.85,
        "income_volatility": 0.60,
        "average_monthly_expense": 110000.0,
        "average_monthly_income": 40000.0,
        "food_ratio": 0.10,
        "shopping_ratio": 0.75,
        "transport_ratio": 0.05,
        "bills_ratio": 0.05,
        "discretionary_ratio": 0.85,
        "weekend_spending_ratio": 0.70,
        "largest_transaction_ratio": 0.35,
        "transaction_frequency": 60.0,
        "category_spending_entropy": 1.1,
    }

    outlier_res = onnx_detector.predict(outlier_vector)
    assert outlier_res["is_anomaly"] is True
    assert outlier_res["anomaly_score"] >= 0.60
    assert outlier_res["severity"] in ["high", "critical"]
    assert len(outlier_res["contributing_features"]) > 0

    # Verify structured insight matches ML schema contract
    insight = outlier_res["insight"]
    assert insight["type"] == "anomaly"
    assert insight["severity"] in ["high", "critical"]
    assert insight["score"] == outlier_res["anomaly_score"]
    assert "explanation" in insight
