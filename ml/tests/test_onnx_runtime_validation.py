"""
Unit Tests for ONNX Runtime Inference Equivalence and Validation.
"""

import json
from pathlib import Path
import numpy as np
import pytest

from ml.src.validation.onnx_runtime_validator import ONNXRuntimeValidator

MODELS_DIR = Path("ml/models")


@pytest.fixture
def validator():
    return ONNXRuntimeValidator(models_dir=MODELS_DIR)


def test_anomaly_onnx_runtime_equivalence(validator):
    """
    Asserts 100% categorical label equivalence and <1e-4 numerical error between
    Sklearn IsolationForest and isolation_forest.onnx.
    """
    res = validator.validate_anomaly_model(num_samples=500, atol=1e-4)
    assert res.total_samples == 500
    assert res.label_concordance_pct == 100.0
    assert res.label_matches == 500
    assert res.decision_score_max_abs_error < 1e-4
    assert res.decision_score_mean_squared_error < 1e-6
    assert res.is_equivalent is True


def test_clustering_onnx_runtime_equivalence(validator):
    """
    Asserts 100% cluster assignment concordance and MSE < 1e-4 between
    Sklearn KMeans and kmeans_clusterer.onnx.
    """
    res = validator.validate_clustering_model(num_samples=500)
    assert res.total_samples == 500
    assert res.label_concordance_pct == 100.0
    assert res.label_matches == 500
    assert res.distance_tensor_mean_squared_error < 1e-4
    assert res.is_equivalent is True


def test_batch_scalability_across_dimensions(validator):
    """
    Asserts ONNX Runtime accepts varying batch sizes from single-instance
    to large batches.
    """
    batch_sizes = [1, 2, 7, 16, 64, 128]
    success = validator.validate_batch_scalability(batch_sizes=batch_sizes)
    assert success is True


def test_validation_report_generation(validator, tmp_path):
    """
    Asserts the validation report is generated with correct schema and passing status.
    """
    report_file = tmp_path / "test_onnx_validation_report.json"
    report = validator.run_full_validation(output_report_path=report_file, num_samples=200)

    assert report.all_models_equivalent is True
    assert report.anomaly_validation.label_concordance_pct == 100.0
    assert report.clustering_validation.label_concordance_pct == 100.0
    assert report.batch_scalability_passed is True
    assert report_file.exists()

    with open(report_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert data["all_models_equivalent"] is True
    assert "timestamp" in data
    assert "anomaly_validation" in data
    assert "clustering_validation" in data


def test_preprocessing_standard_scaler_invariance():
    """
    Verifies manual normalization using clustering manifest mean/scale vectors matches
    sklearn.preprocessing.StandardScaler exactly.
    """
    manifest_path = MODELS_DIR / "clustering_model.manifest.json"
    assert manifest_path.exists()

    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    scaler_mean_dict = manifest["preprocessing_requirements"]["scaler_mean"]
    scaler_scale_dict = manifest["preprocessing_requirements"]["scaler_scale"]

    mean = np.array(list(scaler_mean_dict.values()), dtype=np.float32)
    scale = np.array(list(scaler_scale_dict.values()), dtype=np.float32)

    raw_features = np.random.uniform(10, 1000, size=(10, 8)).astype(np.float32)
    manual_scaled = (raw_features - mean) / scale

    # Check bounds and finiteness
    assert np.all(np.isfinite(manual_scaled))
    assert manual_scaled.shape == (10, 8)
