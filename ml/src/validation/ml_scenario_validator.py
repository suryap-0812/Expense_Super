"""
ML Scenario Validation Engine (Phase 11)
Tests the end-to-end ML intelligence system against known synthetic scenarios and 5 controlled injected anomaly types
(Section 30 and Section 70 of the Master Technical Specification).
Measures precision, recall, false-positive rate, false-negative rate, noise robustness, and documents model limitations.
"""

import datetime
import json
import os
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
from sklearn.metrics import confusion_matrix, precision_score, recall_score, f1_score, roc_auc_score

from ml.src.generation.config import (
    BehavioralProfileType,
    EXPENSE_CATEGORIES,
    GenerationConfig,
    PAYMENT_METHODS,
)
from ml.src.generation.profiles import get_profile_parameters, BASE_CATEGORY_WEIGHTS
from ml.src.generation.anomalies import AnomalyType, inject_transaction_anomaly, ANOMALY_DESCRIPTIONS
from ml.src.preprocessing.preprocessor import TransactionPreprocessor
from ml.src.features.engineer import FeatureEngineer
from ml.src.models.anomaly_detector import AnomalyDetector
from ml.src.export.ml_output_generator import generate_structured_ml_output


class MLScenarioValidator:
    """Automated benchmark and validation engine across controlled financial scenarios."""

    def __init__(self, seed: int = 42):
        self.seed = seed
        self.rng = np.random.RandomState(seed)
        self.preprocessor = TransactionPreprocessor()
        self.engineer = FeatureEngineer()
        self.detector = AnomalyDetector(use_onnx=True)

    def _choose_day(self, year: int, month: int, days_in_month: int, is_weekend: bool) -> int:
        """Helper to pick a day conforming to weekend or weekday requirement."""
        possible_days = []
        for d in range(1, days_in_month + 1):
            dt = datetime.date(year, month, d)
            # 4=Fri, 5=Sat, 6=Sun
            day_is_weekend = dt.weekday() in [4, 5, 6]
            if day_is_weekend == is_weekend:
                possible_days.append(d)
        if not possible_days:
            return int(self.rng.randint(1, days_in_month + 1))
        return int(self.rng.choice(possible_days))

    def generate_scenario_dataset(
        self,
        n_normal_per_profile: int = 80,
        n_anomalous_per_type: int = 48,
    ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """
        Generates a balanced evaluation dataset with known ground truth labels:
        - Normal baseline users across disciplined profiles (is_anomalous = 0)
        - Controlled anomaly users across all 5 injected anomaly types (is_anomalous = 1)
        """
        users_records: List[Dict[str, Any]] = []
        transactions_records: List[Dict[str, Any]] = []
        tx_counter = 1

        normal_profiles = [
            BehavioralProfileType.GOOD_SAVER,
            BehavioralProfileType.CONSISTENT_SPENDER,
            BehavioralProfileType.GOAL_ORIENTED_SAVER,
        ]

        # 1. Normal Baseline Users
        user_idx = 1
        for profile_name in normal_profiles:
            params = get_profile_parameters(profile_name)
            for _ in range(n_normal_per_profile):
                u_id = f"VAL_NORM_{user_idx:04d}"
                user_idx += 1
                months_active = 3
                income_base = max(20000.0, float(self.rng.normal(params.income_mean, params.income_std)))

                users_records.append({
                    "user_id": u_id,
                    "profile": profile_name.value,
                    "is_anomalous": 0,
                    "anomaly_type": None,
                    "income_base": round(income_base, 2),
                    "months_active": months_active,
                })

                # Generate clean multi-month transactions without anomalies
                start_year = 2026
                start_month = 1
                for month_offset in range(months_active):
                    target_month = ((start_month - 1 + month_offset) % 12) + 1
                    year_offset = (start_month - 1 + month_offset) // 12
                    target_year = start_year + year_offset
                    days_in_month = 30 if target_month in [4, 6, 9, 11] else (28 if target_month == 2 else 31)

                    # Salary credit
                    sal_day = int(self.rng.randint(1, 6))
                    transactions_records.append({
                        "transaction_id": f"tx_val_{tx_counter:08d}",
                        "user_id": u_id,
                        "type": "income",
                        "amount": round(income_base, 2),
                        "category": "Salary",
                        "payment_method": "Bank Transfer",
                        "transaction_date": datetime.date(target_year, target_month, sal_day).isoformat(),
                        "description": "Monthly corporate salary credit",
                        "is_anomaly": False,
                        "anomaly_type": None,
                    })
                    tx_counter += 1

                    # Generate category-consistent monthly transactions
                    exp_ratio = max(0.20, float(self.rng.normal(params.expense_ratio_mean, 0.01)))
                    monthly_exp = income_base * exp_ratio

                    for cat, weight in params.category_weights.items():
                        cat_budget = monthly_exp * weight
                        if cat_budget < 100.0:
                            continue
                        n_tx = max(1, int(round(weight * params.avg_tx_count_per_month)))
                        for _ in range(n_tx):
                            pm = str(self.rng.choice(PAYMENT_METHODS))
                            is_weekend = bool(self.rng.uniform(0.0, 1.0) < params.weekend_bias)
                            day = self._choose_day(target_year, target_month, days_in_month, is_weekend)
                            amt = round(max(20.0, cat_budget / n_tx * float(self.rng.normal(1.0, 0.10))), 2)

                            transactions_records.append({
                                "transaction_id": f"tx_val_{tx_counter:08d}",
                                "user_id": u_id,
                                "type": "expense",
                                "amount": amt,
                                "category": cat,
                                "payment_method": pm,
                                "transaction_date": datetime.date(target_year, target_month, day).isoformat(),
                                "description": f"{cat} payment",
                                "is_anomaly": False,
                                "anomaly_type": None,
                            })
                            tx_counter += 1

        # 2. Controlled Anomaly Users (All 5 Types)
        anomaly_types = [
            AnomalyType.SPENDING_ANOMALY,
            AnomalyType.CATEGORY_INCREASE,
            AnomalyType.SAVINGS_DECLINE,
            AnomalyType.WEEKEND_SPIKE,
            AnomalyType.FREQUENCY_BURST,
        ]

        for a_type in anomaly_types:
            for _ in range(n_anomalous_per_type):
                u_id = f"VAL_ANOM_{user_idx:04d}"
                user_idx += 1
                profile_obj = normal_profiles[int(self.rng.choice(len(normal_profiles)))]
                params = get_profile_parameters(profile_obj)
                months_active = 3
                income_base = max(20000.0, float(self.rng.normal(params.income_mean, params.income_std)))

                users_records.append({
                    "user_id": u_id,
                    "profile": profile_obj.value,
                    "is_anomalous": 1,
                    "anomaly_type": a_type.value,
                    "income_base": round(income_base, 2),
                    "months_active": months_active,
                })

                start_year = 2026
                start_month = 1
                for month_offset in range(months_active):
                    target_month = ((start_month - 1 + month_offset) % 12) + 1
                    year_offset = (start_month - 1 + month_offset) // 12
                    target_year = start_year + year_offset
                    days_in_month = 30 if target_month in [4, 6, 9, 11] else (28 if target_month == 2 else 31)

                    sal_day = int(self.rng.randint(1, 6))
                    transactions_records.append({
                        "transaction_id": f"tx_val_{tx_counter:08d}",
                        "user_id": u_id,
                        "type": "income",
                        "amount": round(income_base, 2),
                        "category": "Salary",
                        "payment_method": "Bank Transfer",
                        "transaction_date": datetime.date(target_year, target_month, sal_day).isoformat(),
                        "description": "Monthly corporate salary credit",
                        "is_anomaly": False,
                        "anomaly_type": None,
                    })
                    tx_counter += 1

                    # Generate category-consistent transactions
                    is_anomaly_month = (month_offset == months_active - 1)
                    exp_ratio = max(0.20, float(self.rng.normal(params.expense_ratio_mean, 0.01)))
                    if is_anomaly_month and a_type == AnomalyType.SAVINGS_DECLINE:
                        exp_ratio = 1.35  # Sudden deficit spike

                    monthly_exp = income_base * exp_ratio
                    weekend_prob = 0.85 if (is_anomaly_month and a_type == AnomalyType.WEEKEND_SPIKE) else params.weekend_bias

                    for cat, weight in params.category_weights.items():
                        cat_budget = monthly_exp * weight
                        if cat_budget < 100.0:
                            continue
                        n_tx = max(1, int(round(weight * params.avg_tx_count_per_month)))
                        for _ in range(n_tx):
                            pm = str(self.rng.choice(PAYMENT_METHODS))
                            is_weekend = bool(self.rng.uniform(0.0, 1.0) < weekend_prob)
                            day = self._choose_day(target_year, target_month, days_in_month, is_weekend)
                            amt = round(max(20.0, cat_budget / n_tx * float(self.rng.normal(1.0, 0.10))), 2)

                            transactions_records.append({
                                "transaction_id": f"tx_val_{tx_counter:08d}",
                                "user_id": u_id,
                                "type": "expense",
                                "amount": amt,
                                "category": cat,
                                "payment_method": pm,
                                "transaction_date": datetime.date(target_year, target_month, day).isoformat(),
                                "description": f"{cat} payment",
                                "is_anomaly": False,
                                "anomaly_type": None,
                            })
                            tx_counter += 1

                    # Injected anomaly events in the evaluation month
                    if is_anomaly_month:
                        if a_type == AnomalyType.SPENDING_ANOMALY:
                            # 3x-6x major single purchase (e.g. 50% of income)
                            anom_amount = round(float(self.rng.uniform(0.40, 0.70) * income_base), 2)
                            anom_day = int(self.rng.randint(1, days_in_month + 1))
                            transactions_records.append({
                                "transaction_id": f"tx_val_{tx_counter:08d}",
                                "user_id": u_id,
                                "type": "expense",
                                "amount": anom_amount,
                                "category": "Shopping",
                                "payment_method": "Credit Card",
                                "transaction_date": datetime.date(target_year, target_month, anom_day).isoformat(),
                                "description": "Unplanned major electronics purchase",
                                "is_anomaly": True,
                                "anomaly_type": a_type.value,
                            })
                            tx_counter += 1

                        elif a_type == AnomalyType.CATEGORY_INCREASE:
                            # Sudden 3x shopping surge (5 concentrated transactions totaling 40% of income)
                            surge_amt = (0.45 * income_base) / 4.0
                            for k in range(4):
                                anom_day = int(self.rng.randint(10, 20))
                                transactions_records.append({
                                    "transaction_id": f"tx_val_{tx_counter:08d}",
                                    "user_id": u_id,
                                    "type": "expense",
                                    "amount": round(surge_amt, 2),
                                    "category": "Shopping",
                                    "payment_method": "Credit Card",
                                    "transaction_date": datetime.date(target_year, target_month, anom_day).isoformat(),
                                    "description": "High-frequency shopping spree",
                                    "is_anomaly": True,
                                    "anomaly_type": a_type.value,
                                })
                                tx_counter += 1

                        elif a_type == AnomalyType.WEEKEND_SPIKE:
                            # Weekend luxury dining / travel surge (3 massive transactions on Saturday/Sunday)
                            spike_amt = (0.40 * income_base) / 3.0
                            for k in range(3):
                                sat_day = self._choose_day(target_year, target_month, days_in_month, is_weekend=True)
                                transactions_records.append({
                                    "transaction_id": f"tx_val_{tx_counter:08d}",
                                    "user_id": u_id,
                                    "type": "expense",
                                    "amount": round(spike_amt, 2),
                                    "category": "Entertainment",
                                    "payment_method": "Credit Card",
                                    "transaction_date": datetime.date(target_year, target_month, sat_day).isoformat(),
                                    "description": "Major weekend trip & hospitality spending",
                                    "is_anomaly": True,
                                    "anomaly_type": a_type.value,
                                })
                                tx_counter += 1

                        elif a_type == AnomalyType.FREQUENCY_BURST:
                            # 8 flurry micro-transactions within the same 24 hours
                            burst_day = int(self.rng.randint(5, 25))
                            for k in range(8):
                                transactions_records.append({
                                    "transaction_id": f"tx_val_{tx_counter:08d}",
                                    "user_id": u_id,
                                    "type": "expense",
                                    "amount": round(float(self.rng.uniform(800.0, 2500.0)), 2),
                                    "category": "Food",
                                    "payment_method": "UPI",
                                    "transaction_date": datetime.date(target_year, target_month, burst_day).isoformat(),
                                    "description": "Rapid online micro-transactions",
                                    "is_anomaly": True,
                                    "anomaly_type": a_type.value,
                                })
                                tx_counter += 1

        users_df = pd.DataFrame(users_records)
        tx_df = pd.DataFrame(transactions_records)

        # Preprocess and extract features across the 3-month window
        prep_tx = self.preprocessor.transform(tx_df)
        prep_tx_by_user = dict(tuple(prep_tx.groupby("user_id")))
        feature_rows: List[Dict[str, Any]] = []

        for u_id in users_df["user_id"]:
            u_tx = prep_tx_by_user.get(u_id, pd.DataFrame())
            feats = self.engineer.extract_user_features(u_tx)
            feats["user_id"] = u_id
            feature_rows.append(feats)

        features_df = pd.DataFrame(feature_rows)
        return users_df, tx_df, features_df

    def evaluate_scenarios(
        self,
        users_df: pd.DataFrame,
        tx_df: pd.DataFrame,
        features_df: pd.DataFrame,
    ) -> Dict[str, Any]:
        """
        Runs the full ML intelligence pipeline (Model + Pattern Analysis + Structured Output)
        across all scenario users and computes precision, recall, false-positive rate,
        false-negative rate, and per-scenario detection breakdown.
        """
        y_true = users_df["is_anomalous"].astype(int).values
        anomaly_types = users_df["anomaly_type"].fillna("NONE").values

        y_pred = []
        y_scores = []
        pipeline_detections = []

        feature_cols = self.detector.feature_names
        prep_tx = self.preprocessor.transform(tx_df)
        tx_by_user = dict(tuple(prep_tx.groupby("user_id")))

        for idx, row in features_df.iterrows():
            u_id = row["user_id"]
            f_dict = {col: float(row[col]) for col in feature_cols if col in row}
            model_res = self.detector.predict(f_dict)
            user_tx = tx_by_user.get(u_id, pd.DataFrame())

            # Generate structured ML output
            ml_output = generate_structured_ml_output(
                user_tx,
                period="latest",
                anomaly_inference=model_res,
            )

            # Ground-truth scenario anomaly detection
            is_detected = False
            if model_res["anomaly_score"] >= 0.65:
                is_detected = True

            for ins in ml_output["insights"]:
                itype = ins["type"]
                if itype == "spending_anomaly" and ins.get("score", 0) >= 0.60:
                    is_detected = True
                elif itype == "category_increase" and ins.get("value") is not None and ins["value"] >= 100.0 and ins.get("amount", 0) >= 5000.0:
                    is_detected = True
                elif itype == "savings_decline" and ins.get("amount", 0) >= 5000.0:
                    is_detected = True
                elif itype == "weekend_concentration" and ins.get("value", 0) >= 65.0:
                    is_detected = True
                elif itype == "transaction_burst" and ins.get("value", 0) >= 6:
                    is_detected = True

            score_val = max(model_res["anomaly_score"], max([i.get("score", 0.0) for i in ml_output["insights"]] + [0.0]))
            y_pred.append(1 if is_detected else 0)
            y_scores.append(float(score_val))
            pipeline_detections.append(is_detected)

        y_pred = np.array(y_pred)
        y_scores = np.array(y_scores)

        # Global metrics
        cm = confusion_matrix(y_true, y_pred)
        tn, fp, fn, tp = cm.ravel()

        precision = float(precision_score(y_true, y_pred, zero_division=0))
        recall = float(recall_score(y_true, y_pred, zero_division=0))
        fpr = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0
        fnr = float(fn / (fn + tp)) if (fn + tp) > 0 else 0.0
        specificity = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0
        f1 = float(f1_score(y_true, y_pred, zero_division=0))
        roc_auc = float(roc_auc_score(y_true, y_scores))

        # Per-scenario detection breakdown
        scenario_breakdown: Dict[str, Dict[str, Any]] = {}
        for a_type in ["NONE"] + [t.value for t in AnomalyType]:
            mask = (anomaly_types == a_type)
            if np.sum(mask) == 0:
                continue
            sub_true = y_true[mask]
            sub_pred = y_pred[mask]
            sub_scores = y_scores[mask]
            sub_total = len(sub_true)
            detected = int(np.sum(sub_pred == 1))
            rate = float(detected / sub_total) if sub_total > 0 else 0.0

            scenario_breakdown[a_type] = {
                "sample_size": sub_total,
                "detected_count": detected,
                "detection_rate": round(rate, 4),
                "mean_anomaly_score": round(float(np.mean(sub_scores)), 4),
            }

        return {
            "dataset_size": len(y_true),
            "normal_samples": int(np.sum(y_true == 0)),
            "anomalous_samples": int(np.sum(y_true == 1)),
            "confusion_matrix": {
                "true_negatives": int(tn),
                "false_positives": int(fp),
                "false_negatives": int(fn),
                "true_positives": int(tp),
            },
            "metrics": {
                "precision": round(precision, 4),
                "recall": round(recall, 4),
                "false_positive_rate": round(fpr, 4),
                "false_negative_rate": round(fnr, 4),
                "specificity": round(specificity, 4),
                "f1_score": round(f1, 4),
                "roc_auc": round(roc_auc, 4),
            },
            "scenario_breakdown": scenario_breakdown,
        }

    def evaluate_noise_robustness(
        self,
        features_df: pd.DataFrame,
        noise_levels: List[float] = [0.05, 0.10, 0.20],
    ) -> Dict[str, Any]:
        """
        Evaluates prediction stability when feature inputs are perturbed by Gaussian noise.
        """
        feature_cols = self.detector.feature_names
        X = features_df[feature_cols].values

        base_preds = []
        for idx in range(len(X)):
            f_dict = {col: float(X[idx, i]) for i, col in enumerate(feature_cols)}
            res = self.detector.predict(f_dict)
            base_preds.append(1 if res["is_anomaly"] else 0)
        base_preds = np.array(base_preds)

        robustness_results: Dict[str, Any] = {}

        for noise_sd in noise_levels:
            perturbed_matches = 0
            n_trials = 5
            for trial in range(n_trials):
                noise = self.rng.normal(0, noise_sd, size=X.shape)
                X_perturbed = X * (1.0 + noise)
                X_perturbed = np.clip(X_perturbed, 0.0, None)

                for idx in range(len(X_perturbed)):
                    f_dict = {col: float(X_perturbed[idx, i]) for i, col in enumerate(feature_cols)}
                    res = self.detector.predict(f_dict)
                    p = 1 if res["is_anomaly"] else 0
                    if p == base_preds[idx]:
                        perturbed_matches += 1

            stability_score = perturbed_matches / (len(X) * n_trials)
            robustness_results[f"noise_sigma_{int(noise_sd * 100)}pct"] = {
                "noise_std_dev": noise_sd,
                "label_stability_rate": round(stability_score, 4),
                "status": "robust" if stability_score >= 0.85 else "sensitive",
            }

        return robustness_results

    def run_full_validation_suite(
        self,
        n_normal_per_profile: int = 80,
        n_anomalous_per_type: int = 48,
        output_path: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Executes complete Phase 11 scenario validation benchmark."""
        print("1. Generating synthetic scenario validation dataset...")
        users_df, tx_df, features_df = self.generate_scenario_dataset(
            n_normal_per_profile=n_normal_per_profile,
            n_anomalous_per_type=n_anomalous_per_type,
        )

        print("2. Evaluating ML intelligence pipeline across controlled scenarios...")
        scenario_eval = self.evaluate_scenarios(users_df, tx_df, features_df)

        print("3. Evaluating noise perturbation robustness...")
        robustness_eval = self.evaluate_noise_robustness(features_df)

        # Document explicit model limitations and failure boundary modes
        limitations = [
            {
                "boundary": "Cold-Start Data Sparsity (< 10 transactions)",
                "behavior": "Model inference is suppressed and data_quality.sufficient_data is flagged False. Prevents spurious false positives on new accounts.",
                "mitigation": "Fallback to deterministic analytics until minimum 10 transactions accumulated.",
            },
            {
                "boundary": "Single Pay-Cycle Volatility",
                "behavior": "Users with only 1 month of history cannot compute month-over-month trends (OLS trend returns None).",
                "mitigation": "Requires >= 2 distinct months for linear trend regression.",
            },
            {
                "boundary": "Symmetric Inflows / Sudden Bonusing",
                "behavior": "A massive legitimate one-off bonus (e.g. ₹500,000) creates income volatility and high largest_transaction_ratio, which can score as an anomaly.",
                "mitigation": "Structured output explains contributing feature is income-driven rather than an alarming spending deficit.",
            },
            {
                "boundary": "Gradual Creeping Lifestyle Inflation",
                "behavior": "Unsupervised Isolation Forest detects point/subspace outliers rather than slow secular 2% monthly lifestyle inflation across 12 months.",
                "mitigation": "Detected by Phase 8 deterministic OLS trend analyzer (spending_trend slope > 0).",
            },
        ]

        report = {
            "timestamp": pd.Timestamp.now(tz="UTC").isoformat(),
            "validation_phase": "Phase 11: ML Validation",
            "model_type": "Isolation Forest (100 estimators, 5% contamination)",
            "benchmark_dataset": scenario_eval,
            "noise_robustness": robustness_eval,
            "documented_limitations": limitations,
            "validation_passed": bool(
                scenario_eval["metrics"]["recall"] >= 0.85
                and scenario_eval["metrics"]["false_positive_rate"] <= 0.10
            ),
        }

        # Save report
        if output_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            output_path = os.path.join(base_dir, "models", "ml_validation_report.json")

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)

        print(f"Validation report saved to: {output_path}")
        return report


if __name__ == "__main__":
    validator = MLScenarioValidator(seed=42)
    report = validator.run_full_validation_suite()
    print("\n--- PHASE 11 VALIDATION RESULTS ---")
    print(f"Precision: {report['benchmark_dataset']['metrics']['precision']:.4f}")
    print(f"Recall (Sensitivity): {report['benchmark_dataset']['metrics']['recall']:.4f}")
    print(f"False Positive Rate (FPR): {report['benchmark_dataset']['metrics']['false_positive_rate']:.4f}")
    print(f"False Negative Rate (FNR): {report['benchmark_dataset']['metrics']['false_negative_rate']:.4f}")
    print(f"F1 Score: {report['benchmark_dataset']['metrics']['f1_score']:.4f}")
    print(f"ROC AUC: {report['benchmark_dataset']['metrics']['roc_auc']:.4f}")
    print(f"Validation Passed: {report['validation_passed']}")
