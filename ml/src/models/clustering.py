"""
Behavioral Clustering Experimenter (K-Means)
Implements unsupervised clustering evaluation on financial behavioral features (Sections 25 & 68).
Sweeps K=2..10, evaluates silhouette score, Davies-Bouldin, stability, profile separation,
and exports the optimal cluster model to ONNX.
"""

import argparse
import datetime
import json
import os
from typing import Any, Dict, List, Optional, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.metrics import (
    adjusted_rand_score,
    calinski_harabasz_score,
    davies_bouldin_score,
    normalized_mutual_info_score,
    silhouette_score,
)
from sklearn.preprocessing import StandardScaler
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType
import onnxruntime as ort


CLUSTERING_FEATURES = [
    "savings_rate",
    "expense_volatility",
    "transaction_frequency",
    "food_ratio",
    "shopping_ratio",
    "weekend_spending_ratio",
    "average_monthly_income",
    "average_monthly_expense",
]


class BehavioralClusterExperimenter:
    """Evaluates K-Means clustering across K=2..10 and profiles behavioral personas."""

    def __init__(
        self,
        features_path: str = "ml/data/features/user_features.parquet",
        models_dir: str = "ml/models",
        random_state: int = 42,
    ):
        self.features_path = features_path
        self.models_dir = models_dir
        self.random_state = random_state
        self.feature_names = CLUSTERING_FEATURES
        self.scaler = StandardScaler()
        self.best_model: Optional[KMeans] = None
        self.best_k: int = 4

    def load_features(self) -> pd.DataFrame:
        """Loads user feature matrix."""
        if not os.path.exists(self.features_path):
            csv_path = self.features_path.replace(".parquet", ".csv")
            if os.path.exists(csv_path):
                self.features_path = csv_path
            else:
                raise FileNotFoundError(f"Features file not found at '{self.features_path}'")

        if self.features_path.endswith(".parquet"):
            return pd.read_parquet(self.features_path)
        return pd.read_csv(self.features_path)

    def run_experiment(self, k_range: Tuple[int, int] = (2, 10)) -> Dict[str, Any]:
        """Sweeps K-Means over the range of K and calculates validation metrics."""
        df = self.load_features()
        missing = [f for f in self.feature_names if f not in df.columns]
        if missing:
            raise ValueError(f"Missing required clustering features: {missing}")

        X_raw = df[self.feature_names].values.astype(np.float32)
        X_scaled = self.scaler.fit_transform(X_raw)

        ground_truth_profiles = df["profile"].values if "profile" in df.columns else None

        results_by_k: Dict[str, Any] = {}
        best_silhouette = -1.0
        best_k = 4
        models_by_k: Dict[int, KMeans] = {}

        print(f"Evaluating K-Means clustering for K={k_range[0]}..{k_range[1]} on {len(X_raw)} samples...")

        for k in range(k_range[0], k_range[1] + 1):
            km = KMeans(n_clusters=k, random_state=self.random_state, n_init=10)
            labels = km.fit_predict(X_scaled)
            models_by_k[k] = km

            inertia = float(km.inertia_)
            sil_score = float(silhouette_score(X_scaled, labels, sample_size=min(5000, len(X_scaled)), random_state=self.random_state))
            db_score = float(davies_bouldin_score(X_scaled, labels))
            ch_score = float(calinski_harabasz_score(X_scaled, labels))

            # Stability: Run with another seed and compare Adjusted Rand Index (ARI)
            km_alt = KMeans(n_clusters=k, random_state=self.random_state + 100, n_init=10)
            labels_alt = km_alt.fit_predict(X_scaled)
            stability_ari = float(adjusted_rand_score(labels, labels_alt))

            # Ground truth profile separation
            ari_gt = None
            nmi_gt = None
            if ground_truth_profiles is not None:
                ari_gt = round(float(adjusted_rand_score(ground_truth_profiles, labels)), 4)
                nmi_gt = round(float(normalized_mutual_info_score(ground_truth_profiles, labels)), 4)

            results_by_k[str(k)] = {
                "k": k,
                "inertia": round(inertia, 2),
                "silhouette_score": round(sil_score, 4),
                "davies_bouldin_index": round(db_score, 4),
                "calinski_harabasz_index": round(ch_score, 2),
                "cluster_stability_ari": round(stability_ari, 4),
                "profile_separation_ari": ari_gt,
                "profile_separation_nmi": nmi_gt,
            }

            print(f"  K={k:2d} | Inertia={inertia:10.1f} | Silhouette={sil_score:.4f} | DB={db_score:.4f} | Stability={stability_ari:.4f} | ARI_GT={ari_gt}")

            if sil_score > best_silhouette:
                best_silhouette = sil_score
                best_k = k

        self.best_k = best_k
        self.best_model = models_by_k[best_k]

        # Analyze best K cluster centroids and interpret personas
        best_labels = self.best_model.labels_
        personas = self._interpret_centroids(df, X_raw, best_labels, best_k)

        # Production Recommendation (Section 25 Assessment)
        recommendation = self._generate_production_assessment(best_silhouette, results_by_k[str(best_k)])

        # Save artifacts
        os.makedirs(self.models_dir, exist_ok=True)
        joblib_path = os.path.join(self.models_dir, "kmeans_clusterer.joblib")
        joblib.dump({"model": self.best_model, "scaler": self.scaler, "features": self.feature_names}, joblib_path)

        onnx_path = os.path.join(self.models_dir, "kmeans_clusterer.onnx")
        self._export_to_onnx(onnx_path, X_scaled[:10])

        report = {
            "model_type": "KMeans",
            "schema_version": "1.0",
            "evaluated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "n_samples": len(X_raw),
            "features_evaluated": self.feature_names,
            "optimal_k": best_k,
            "best_silhouette_score": round(best_silhouette, 4),
            "results_by_k": results_by_k,
            "personas_interpreted": personas,
            "production_recommendation": recommendation,
            "artifacts": {
                "joblib_path": joblib_path,
                "onnx_path": onnx_path,
            },
        }

        report_path = os.path.join(self.models_dir, "clustering_experiment_report.json")
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)
        print(f"Clustering experiment report saved to '{report_path}'")

        return report

    def _interpret_centroids(
        self,
        df: pd.DataFrame,
        X_raw: np.ndarray,
        labels: np.ndarray,
        k: int,
    ) -> List[Dict[str, Any]]:
        """Characterizes cluster centroids into human-interpretable financial personas."""
        personas: List[Dict[str, Any]] = []

        for cluster_id in range(k):
            idx = np.where(labels == cluster_id)[0]
            cluster_raw = X_raw[idx]
            count = len(idx)
            pct = round((count / len(labels)) * 100, 2)

            means = {self.feature_names[i]: round(float(np.mean(cluster_raw[:, i])), 2) for i in range(len(self.feature_names))}

            # Determine persona archetype based on signature traits
            sav_rate = means["savings_rate"]
            shopping_ratio = means["shopping_ratio"]
            food_ratio = means["food_ratio"]
            weekend_ratio = means["weekend_spending_ratio"]
            volatility = means["expense_volatility"]

            if sav_rate >= 35.0:
                archetype = "Disciplined High Saver"
                description = f"Consistently saves {sav_rate:.1f}% of income with tightly controlled discretionary spending."
            elif sav_rate < 0.0 or shopping_ratio > 0.30:
                archetype = "Discretionary Overspender"
                description = f"Negative or low savings ({sav_rate:.1f}%) driven by heavy shopping ({shopping_ratio*100:.1f}%) and lifestyle purchases."
            elif weekend_ratio > 0.45:
                archetype = "Weekend Lifestyle Spender"
                description = f"Concentrates {weekend_ratio*100:.1f}% of monthly expenditure on weekend dining and social outings."
            elif volatility > 0.25:
                archetype = "Irregular Volatile Budgeter"
                description = f"High spending volatility ({volatility:.2f}) with erratic monthly cash flow spikes."
            elif food_ratio > 0.30:
                archetype = "Food & Dining Heavy"
                description = f"Allocates {food_ratio*100:.1f}% of expenditures to groceries and food services."
            else:
                archetype = "Balanced Everyday Consumer"
                description = f"Moderate savings ({sav_rate:.1f}%) and stable day-to-day spending patterns."

            # Most common synthetic profile in this cluster
            top_profile = "N/A"
            if "profile" in df.columns:
                sub_profiles = df.iloc[idx]["profile"].value_counts()
                if not sub_profiles.empty:
                    top_profile = str(sub_profiles.index[0])

            personas.append({
                "cluster_id": int(cluster_id),
                "archetype": archetype,
                "user_count": int(count),
                "population_share_pct": pct,
                "dominant_synthetic_profile": top_profile,
                "description": description,
                "centroid_means": means,
            })

        return personas

    def _generate_production_assessment(self, best_silhouette: float, best_metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluates whether unsupervised K-Means should be integrated as primary inference or exploratory insight."""
        is_viable = best_silhouette >= 0.25 and best_metrics["cluster_stability_ari"] >= 0.70

        if is_viable:
            verdict = "Supplementary Persona Clustering"
            rationale = (
                f"K-Means (K={self.best_k}) achieves stable cluster separation (Stability ARI={best_metrics['cluster_stability_ari']:.2f}, "
                f"Silhouette={best_silhouette:.4f}). Centroids map cleanly to intuitive financial archetypes. "
                f"Recommended as a secondary peer-benchmarking and persona insight engine, while keeping primary deterministic calculations authoritative."
            )
        else:
            verdict = "Experimental Research Only"
            rationale = (
                f"Cluster separation (Silhouette={best_silhouette:.4f}) is diffuse across continuous consumer spending dimensions. "
                f"Per Section 25, deterministic rules and isolation forest anomaly detection are preferred for core V1 user insights."
            )

        return {
            "verdict": verdict,
            "status": "APPROVED_FOR_SUPPLEMENTARY_INSIGHTS" if is_viable else "DEFERRED_FOR_V1_CORE",
            "optimal_k": self.best_k,
            "rationale": rationale,
        }

    def _export_to_onnx(self, onnx_path: str, test_samples: np.ndarray) -> None:
        """Converts trained scikit-learn KMeans model to ONNX and asserts exact label parity."""
        initial_type = [("float_input", FloatTensorType([None, len(self.feature_names)]))]
        onnx_model = convert_sklearn(
            self.best_model,
            initial_types=initial_type,
            target_opset={"ai.onnx.ml": 3, "": 15},
        )

        with open(onnx_path, "wb") as f:
            f.write(onnx_model.SerializeToString())

        # Parity validation using ONNX Runtime
        sess = ort.InferenceSession(onnx_path)
        ort_preds = sess.run(None, {"float_input": test_samples})
        ort_labels = ort_preds[0].flatten()

        sklearn_labels = self.best_model.predict(test_samples)

        # Assert exact label agreement
        np.testing.assert_array_equal(ort_labels, sklearn_labels)
        print(">>> ONNX Runtime KMeans inference parity VERIFIED: 100% agreement with scikit-learn! <<<")


def main():
    parser = argparse.ArgumentParser(description="Run Behavioral Clustering Experiment.")
    parser.add_argument("--features", type=str, default="ml/data/features/user_features.parquet")
    parser.add_argument("--models-dir", type=str, default="ml/models")
    parser.add_argument("--min-k", type=int, default=2)
    parser.add_argument("--max-k", type=int, default=10)
    parser.add_argument("--seed", type=int, default=42)

    args = parser.parse_args()

    experimenter = BehavioralClusterExperimenter(
        features_path=args.features,
        models_dir=args.models_dir,
        random_state=args.seed,
    )

    experimenter.run_experiment(k_range=(args.min_k, args.max_k))
    print(">>> PHASE 9 BEHAVIORAL CLUSTERING EXPERIMENT COMPLETED! <<<")


if __name__ == "__main__":
    main()
