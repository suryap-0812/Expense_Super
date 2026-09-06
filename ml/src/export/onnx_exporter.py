"""
ONNX Model Exporter and Manifest Generator (Phase 12).

Exports scikit-learn models (Isolation Forest and K-Means Clustering) to standard
ONNX binaries with dynamic batch axes, validates graphs with onnx.checker, and generates
comprehensive model manifests documenting input/output schemas, preprocessing requirements,
and runtime assumptions.
"""

from typing import Any, Dict, List, Optional
import os
import json
import datetime
import joblib
import numpy as np
import onnx
from onnx import ModelProto
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType
import onnxruntime as ort

ANOMALY_FEATURE_NAMES: List[str] = [
    "savings_rate",
    "expense_volatility",
    "income_volatility",
    "average_monthly_expense",
    "average_monthly_income",
    "food_ratio",
    "shopping_ratio",
    "transport_ratio",
    "bills_ratio",
    "discretionary_ratio",
    "weekend_spending_ratio",
    "largest_transaction_ratio",
    "transaction_frequency",
    "category_spending_entropy",
]

CLUSTERING_FEATURE_NAMES: List[str] = [
    "savings_rate",
    "expense_volatility",
    "transaction_frequency",
    "food_ratio",
    "shopping_ratio",
    "weekend_spending_ratio",
    "average_monthly_income",
    "average_monthly_expense",
]

FEATURE_NAMES = ANOMALY_FEATURE_NAMES


class ONNXModelExporter:
    """
    Exports trained scikit-learn models to validated ONNX binaries and generates
    production metadata manifests.
    """

    def __init__(self, models_dir: str = "ml/models", target_opset: int = 15):
        self.models_dir = os.path.abspath(models_dir)
        self.target_opset = target_opset
        os.makedirs(self.models_dir, exist_ok=True)

    def export_anomaly_model(
        self,
        joblib_path: Optional[str] = None,
        onnx_path: Optional[str] = None,
        manifest_path: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Exports Isolation Forest anomaly detector to ONNX and creates a model manifest.
        """
        joblib_file = joblib_path or os.path.join(self.models_dir, "isolation_forest.joblib")
        onnx_file = onnx_path or os.path.join(self.models_dir, "isolation_forest.onnx")
        manifest_file = manifest_path or os.path.join(self.models_dir, "anomaly_detection_model.manifest.json")

        if not os.path.exists(joblib_file):
            raise FileNotFoundError(f"Source model not found at '{joblib_file}'. Train model first.")

        model = joblib.load(joblib_file)

        # Dynamic batch dimension: [None, 14]
        initial_types = [("float_input", FloatTensorType([None, len(FEATURE_NAMES)]))]
        onnx_model: ModelProto = convert_sklearn(
            model,
            initial_types=initial_types,
            target_opset={"ai.onnx.ml": 3, "": self.target_opset},
        )

        # Validate ONNX graph
        onnx.checker.check_model(onnx_model)

        with open(onnx_file, "wb") as f:
            f.write(onnx_model.SerializeToString())

        # Parity check with test inputs
        test_inputs = np.random.randn(5, len(FEATURE_NAMES)).astype(np.float32)
        sess = ort.InferenceSession(onnx_file)
        ort_outputs = sess.run(None, {"float_input": test_inputs})
        sklearn_labels = model.predict(test_inputs)
        sklearn_scores = model.decision_function(test_inputs)

        np.testing.assert_array_equal(ort_outputs[0].flatten(), sklearn_labels)
        np.testing.assert_allclose(ort_outputs[1].flatten(), sklearn_scores, rtol=1e-4, atol=1e-4)

        file_size_bytes = os.path.getsize(onnx_file)

        manifest = {
            "model_name": "isolation_forest_anomaly_detector",
            "model_type": "IsolationForest",
            "version": "1.0.0",
            "schema_version": "1.0",
            "exported_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "target_opset": self.target_opset,
            "file_size_bytes": file_size_bytes,
            "artifacts": {
                "onnx_model": os.path.basename(onnx_file),
                "joblib_model": os.path.basename(joblib_file),
            },
            "input_schema": {
                "name": "float_input",
                "tensor_type": "tensor(float)",
                "data_type": "float32",
                "shape": ["None", len(FEATURE_NAMES)],
                "feature_count": len(FEATURE_NAMES),
                "features": [
                    {
                        "index": idx,
                        "name": name,
                        "description": f"Continuous behavioral metric: {name}",
                        "dtype": "float32",
                    }
                    for idx, name in enumerate(FEATURE_NAMES)
                ],
            },
            "output_schema": [
                {
                    "name": "label",
                    "tensor_type": "tensor(int64)",
                    "data_type": "int64",
                    "shape": ["None", 1],
                    "interpretation": {
                        "1": "Normal inlier behavior",
                        "-1": "Anomalous behavioral outlier",
                    },
                },
                {
                    "name": "scores",
                    "tensor_type": "tensor(float)",
                    "data_type": "float32",
                    "shape": ["None", 1],
                    "interpretation": "Raw decision function score. Negative values indicate strong anomalies.",
                },
            ],
            "preprocessing_requirements": {
                "normalization": "None (Tree-based model operates directly on raw calibrated feature scale)",
                "missing_values": "Impute with 0.0 before inference",
                "feature_order_strict": True,
                "minimum_transactions": 10,
                "minimum_coverage_months": 1,
            },
            "runtime_assumptions": {
                "supported_runtimes": ["ONNX Runtime", "ONNX Runtime Web (WASM)", "ONNX Runtime Mobile"],
                "min_onnxruntime_version": "1.15.0",
                "execution_providers": ["CPUExecutionProvider", "WasmExecutionProvider"],
                "thread_safety": "Thread-safe for concurrent read-only inference sessions",
            },
        }

        with open(manifest_file, "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2)

        print(f"Anomaly model exported successfully to '{onnx_file}' ({file_size_bytes:,} bytes)")
        print(f"Manifest written to '{manifest_file}'")
        return manifest

    def export_clustering_model(
        self,
        joblib_path: Optional[str] = None,
        onnx_path: Optional[str] = None,
        manifest_path: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Exports K-Means persona clustering model to ONNX and creates a model manifest.
        """
        joblib_file = joblib_path or os.path.join(self.models_dir, "kmeans_clusterer.joblib")
        onnx_file = onnx_path or os.path.join(self.models_dir, "kmeans_clusterer.onnx")
        manifest_file = manifest_path or os.path.join(self.models_dir, "clustering_model.manifest.json")

        loaded_obj = joblib.load(joblib_file)
        if isinstance(loaded_obj, dict):
            model = loaded_obj["model"]
            scaler = loaded_obj.get("scaler")
        else:
            model = loaded_obj
            scaler = None

        k_clusters = getattr(model, "n_clusters", 6)

        clustering_feature_names = (
            loaded_obj.get("features", CLUSTERING_FEATURE_NAMES)
            if isinstance(loaded_obj, dict)
            else CLUSTERING_FEATURE_NAMES
        )

        initial_types = [("float_input", FloatTensorType([None, len(clustering_feature_names)]))]
        onnx_model: ModelProto = convert_sklearn(
            model,
            initial_types=initial_types,
            target_opset={"ai.onnx.ml": 3, "": self.target_opset},
        )

        # Validate ONNX graph
        onnx.checker.check_model(onnx_model)

        with open(onnx_file, "wb") as f:
            f.write(onnx_model.SerializeToString())

        # Parity check with test inputs
        test_inputs = np.random.randn(5, len(clustering_feature_names)).astype(np.float32)
        sess = ort.InferenceSession(onnx_file)
        ort_outputs = sess.run(None, {"float_input": test_inputs})
        sklearn_labels = model.predict(test_inputs)
        sklearn_distances = model.transform(test_inputs)

        np.testing.assert_array_equal(ort_outputs[0].flatten(), sklearn_labels)
        np.testing.assert_allclose(ort_outputs[1], sklearn_distances, rtol=1e-4, atol=1e-4)

        file_size_bytes = os.path.getsize(onnx_file)

        manifest = {
            "model_name": "kmeans_persona_clusterer",
            "model_type": "KMeans",
            "version": "1.0.0",
            "schema_version": "1.0",
            "exported_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "target_opset": self.target_opset,
            "n_clusters": k_clusters,
            "file_size_bytes": file_size_bytes,
            "artifacts": {
                "onnx_model": os.path.basename(onnx_file),
                "joblib_model": os.path.basename(joblib_file),
            },
            "input_schema": {
                "name": "float_input",
                "tensor_type": "tensor(float)",
                "data_type": "float32",
                "shape": ["None", len(clustering_feature_names)],
                "feature_count": len(clustering_feature_names),
                "features": [
                    {
                        "index": idx,
                        "name": name,
                        "description": f"Standardized behavioral metric: {name}",
                        "dtype": "float32",
                    }
                    for idx, name in enumerate(clustering_feature_names)
                ],
            },
            "output_schema": [
                {
                    "name": "label",
                    "tensor_type": "tensor(int64)",
                    "data_type": "int64",
                    "shape": ["None", 1],
                    "interpretation": f"Cluster assignment index [0..{k_clusters - 1}] mapping to persona archetype.",
                },
                {
                    "name": "distances",
                    "tensor_type": "tensor(float)",
                    "data_type": "float32",
                    "shape": ["None", k_clusters],
                    "interpretation": f"Euclidean distances to all {k_clusters} cluster centroid vectors.",
                },
            ],
            "preprocessing_requirements": {
                "normalization": "StandardScaler (z-score normalization: (x - mean) / std)",
                "missing_values": "Impute with 0.0 before inference",
                "feature_order_strict": True,
                "scaler_mean": (
                    {feat: round(float(scaler.mean_[i]), 4) for i, feat in enumerate(clustering_feature_names)}
                    if scaler is not None and hasattr(scaler, "mean_")
                    else None
                ),
                "scaler_scale": (
                    {feat: round(float(scaler.scale_[i]), 4) for i, feat in enumerate(clustering_feature_names)}
                    if scaler is not None and hasattr(scaler, "scale_")
                    else None
                ),
            },
            "runtime_assumptions": {
                "supported_runtimes": ["ONNX Runtime", "ONNX Runtime Web (WASM)", "ONNX Runtime Mobile"],
                "min_onnxruntime_version": "1.15.0",
                "execution_providers": ["CPUExecutionProvider", "WasmExecutionProvider"],
                "thread_safety": "Thread-safe for concurrent read-only inference sessions",
            },
        }

        with open(manifest_file, "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2)

        print(f"Clustering model exported successfully to '{onnx_file}' ({file_size_bytes:,} bytes)")
        print(f"Manifest written to '{manifest_file}'")
        return manifest

    def export_all(self) -> Dict[str, Any]:
        """
        Exports all ML models and produces the consolidated master manifest.
        """
        anomaly_manifest = self.export_anomaly_model()
        clustering_manifest = self.export_clustering_model()

        master_manifest_file = os.path.join(self.models_dir, "onnx_models_manifest.json")
        master_manifest = {
            "schema_version": "1.0",
            "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "target_opset": self.target_opset,
            "models": {
                "anomaly_detector": anomaly_manifest,
                "persona_clusterer": clustering_manifest,
            },
        }

        with open(master_manifest_file, "w", encoding="utf-8") as f:
            json.dump(master_manifest, f, indent=2)

        print(f"Master ONNX manifest generated at '{master_manifest_file}'")
        return master_manifest


def main():
    exporter = ONNXModelExporter()
    exporter.export_all()
    print(">>> PHASE 12 ONNX EXPORT COMPLETED SUCCESSFULLY! <<<")


if __name__ == "__main__":
    main()
