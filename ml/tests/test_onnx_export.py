"""
Tests for ONNX Model Export, Validations, and Manifests (Phase 12).
"""

import os
import json
import pytest
import numpy as np
import onnx
import onnxruntime as ort

from ml.src.export.onnx_exporter import (
    ONNXModelExporter,
    ANOMALY_FEATURE_NAMES,
    CLUSTERING_FEATURE_NAMES,
)


@pytest.fixture(scope="module")
def exporter(tmp_path_factory) -> ONNXModelExporter:
    """Fixture providing an instantiated ONNXModelExporter using models directory."""
    return ONNXModelExporter(models_dir="ml/models", target_opset=15)


def test_onnx_export_anomaly_model(exporter: ONNXModelExporter):
    """Verifies Isolation Forest ONNX export, graph validity, and manifest conformance."""
    manifest = exporter.export_anomaly_model()

    onnx_file = os.path.join(exporter.models_dir, "isolation_forest.onnx")
    manifest_file = os.path.join(exporter.models_dir, "anomaly_detection_model.manifest.json")

    assert os.path.exists(onnx_file)
    assert os.path.exists(manifest_file)
    assert os.path.getsize(onnx_file) > 0

    # Validate ONNX graph structure
    model_proto = onnx.load(onnx_file)
    onnx.checker.check_model(model_proto)

    assert manifest["model_name"] == "isolation_forest_anomaly_detector"
    assert manifest["input_schema"]["feature_count"] == len(ANOMALY_FEATURE_NAMES)
    assert len(manifest["output_schema"]) == 2

    # Verify input tensor shape and names
    graph = model_proto.graph
    assert len(graph.input) == 1
    assert graph.input[0].name == "float_input"


def test_onnx_export_clustering_model(exporter: ONNXModelExporter):
    """Verifies K-Means ONNX export, graph validity, and manifest conformance."""
    manifest = exporter.export_clustering_model()

    onnx_file = os.path.join(exporter.models_dir, "kmeans_clusterer.onnx")
    manifest_file = os.path.join(exporter.models_dir, "clustering_model.manifest.json")

    assert os.path.exists(onnx_file)
    assert os.path.exists(manifest_file)
    assert os.path.getsize(onnx_file) > 0

    # Validate ONNX graph structure
    model_proto = onnx.load(onnx_file)
    onnx.checker.check_model(model_proto)

    assert manifest["model_name"] == "kmeans_persona_clusterer"
    assert manifest["input_schema"]["feature_count"] == len(CLUSTERING_FEATURE_NAMES)
    assert manifest["n_clusters"] == 6

    # Verify scaler parameters are present
    assert manifest["preprocessing_requirements"]["scaler_mean"] is not None
    assert manifest["preprocessing_requirements"]["scaler_scale"] is not None


def test_onnx_master_manifest(exporter: ONNXModelExporter):
    """Verifies master ONNX bundle manifest integrity."""
    master_manifest = exporter.export_all()
    master_file = os.path.join(exporter.models_dir, "onnx_models_manifest.json")

    assert os.path.exists(master_file)
    assert "anomaly_detector" in master_manifest["models"]
    assert "persona_clusterer" in master_manifest["models"]
    assert master_manifest["schema_version"] == "1.0"


def test_dynamic_batch_inference(exporter: ONNXModelExporter):
    """Verifies ONNX models handle dynamic batch dimensions [1, N], [10, N], [100, N]."""
    anomaly_onnx = os.path.join(exporter.models_dir, "isolation_forest.onnx")
    clustering_onnx = os.path.join(exporter.models_dir, "kmeans_clusterer.onnx")

    sess_anomaly = ort.InferenceSession(anomaly_onnx)
    sess_clustering = ort.InferenceSession(clustering_onnx)

    batch_sizes = [1, 5, 25, 100]

    for b in batch_sizes:
        # Anomaly detector: [b, 14]
        X_anom = np.random.randn(b, len(ANOMALY_FEATURE_NAMES)).astype(np.float32)
        outputs_anom = sess_anomaly.run(None, {"float_input": X_anom})

        assert len(outputs_anom) == 2
        labels_anom = outputs_anom[0].flatten()
        scores_anom = outputs_anom[1].flatten()
        assert len(labels_anom) == b
        assert len(scores_anom) == b
        assert set(labels_anom).issubset({-1, 1})

        # Clustering: [b, 8]
        X_clust = np.random.randn(b, len(CLUSTERING_FEATURE_NAMES)).astype(np.float32)
        outputs_clust = sess_clustering.run(None, {"float_input": X_clust})

        assert len(outputs_clust) == 2
        labels_clust = outputs_clust[0].flatten()
        distances_clust = outputs_clust[1]
        assert len(labels_clust) == b
        assert distances_clust.shape == (b, 6)
        assert np.all((labels_clust >= 0) & (labels_clust < 6))
