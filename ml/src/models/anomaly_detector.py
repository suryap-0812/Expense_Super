"""
Anomaly Detector Inference Engine
Performs local anomaly inference conforming to Section 23 and Section 29 ML contracts.
Supports both ONNX Runtime and joblib backends.
"""

import json
import os
from typing import Any, Dict, List, Optional, Union
import numpy as np


ANOMALY_FEATURE_NAMES = [
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


class AnomalyDetector:
    """Performs inference using trained Isolation Forest (ONNX or joblib)."""

    def __init__(
        self,
        model_path: Optional[str] = None,
        metadata_path: Optional[str] = None,
        use_onnx: bool = True,
    ):
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        models_dir = os.path.join(base_dir, "models")

        self.metadata_path = metadata_path or os.path.join(models_dir, "anomaly_model_metadata.json")
        self.use_onnx = use_onnx
        self.feature_names = ANOMALY_FEATURE_NAMES
        self.feature_means: Dict[str, float] = {}
        self.feature_stds: Dict[str, float] = {}

        self._load_metadata()

        if model_path is None:
            if self.use_onnx:
                self.model_path = os.path.join(models_dir, "isolation_forest.onnx")
            else:
                self.model_path = os.path.join(models_dir, "isolation_forest.joblib")
        else:
            self.model_path = model_path

        self.ort_session = None
        self.joblib_model = None
        self._load_model()

    def _load_metadata(self) -> None:
        """Loads baseline distributions from model metadata."""
        if os.path.exists(self.metadata_path):
            with open(self.metadata_path, "r", encoding="utf-8") as f:
                meta = json.load(f)
                self.feature_names = meta.get("feature_list", ANOMALY_FEATURE_NAMES)
                baselines = meta.get("feature_baselines", {})
                self.feature_means = baselines.get("mean", {})
                self.feature_stds = baselines.get("std", {})

    def _load_model(self) -> None:
        """Initializes ONNX Runtime session or joblib estimator."""
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Anomaly model not found at '{self.model_path}'")

        if self.model_path.endswith(".onnx"):
            import onnxruntime as ort
            self.ort_session = ort.InferenceSession(self.model_path)
        else:
            import joblib
            self.joblib_model = joblib.load(self.model_path)

    def predict(self, features: Union[Dict[str, float], List[float], np.ndarray]) -> Dict[str, Any]:
        """
        Executes inference for a feature dictionary or vector.
        Returns:
            anomaly_score: float in [0, 1]
            is_anomaly: bool
            severity: str ("info" | "low" | "medium" | "high" | "critical")
            contributing_features: list of top deviating features
            insight: dict conforming to MLInsightItemSchema
        """
        if isinstance(features, dict):
            vector = [float(features.get(f, 0.0)) for f in self.feature_names]
            feat_dict = features
        else:
            vector = [float(x) for x in np.asarray(features).flatten()]
            feat_dict = {f: vector[i] for i, f in enumerate(self.feature_names[:len(vector)])}

        X = np.array([vector], dtype=np.float32)

        # Raw decision score: positive is inlier, negative is outlier
        if self.ort_session is not None:
            outputs = self.ort_session.run(None, {"float_input": X})
            raw_label = int(outputs[0].flatten()[0])
            raw_score = float(outputs[1].flatten()[0])
        else:
            raw_label = int(self.joblib_model.predict(X)[0])
            raw_score = float(self.joblib_model.decision_function(X)[0])

        is_anomaly = bool(raw_label == -1)

        # Calibrate raw score to [0, 1] anomaly probability
        # Decision function typically spans [-0.3, +0.3]
        # Sigmoid calibration centered around 0 with temperature
        calibrated_score = round(float(1.0 / (1.0 + np.exp(12.0 * raw_score))), 4)

        # Determine severity level
        if calibrated_score >= 0.85:
            severity = "critical"
        elif calibrated_score >= 0.65:
            severity = "high"
        elif calibrated_score >= 0.50:
            severity = "medium"
        elif calibrated_score >= 0.35:
            severity = "low"
        else:
            severity = "info"

        # Calculate contributing features (ranked by z-score deviation from population baseline)
        contributing_features: List[Dict[str, Any]] = []
        for feat in self.feature_names:
            if feat in feat_dict and feat in self.feature_means:
                val = float(feat_dict[feat])
                mean = self.feature_means[feat]
                std = self.feature_stds.get(feat, 1.0)
                if std > 0:
                    z_score = abs(val - mean) / std
                    contributing_features.append({
                        "feature": feat,
                        "value": round(val, 4),
                        "baseline_mean": mean,
                        "z_score": round(float(z_score), 2),
                    })

        contributing_features.sort(key=lambda x: x["z_score"], reverse=True)
        top_contributors = contributing_features[:3]

        # Construct structured insight payload conforming to Section 29 MLInsightItemSchema
        primary_driver = top_contributors[0]["feature"] if top_contributors else "unusual_spending"
        explanation = (
            f"Detected unusual financial pattern with {severity} anomaly score ({calibrated_score:.2f}). "
            f"Primary deviation driven by '{primary_driver}'."
            if is_anomaly
            else "Spending patterns align with typical consumer behavior."
        )

        insight_item = {
            "type": "anomaly",
            "category": primary_driver,
            "value": calibrated_score,
            "severity": severity,
            "score": calibrated_score,
            "explanation": explanation,
        }

        return {
            "anomaly_score": calibrated_score,
            "raw_decision_score": round(raw_score, 4),
            "is_anomaly": is_anomaly,
            "severity": severity,
            "contributing_features": top_contributors,
            "insight": insight_item,
        }
