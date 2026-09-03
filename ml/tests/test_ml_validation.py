"""
Tests for ML Validation, Scenario Benchmarks, and Robustness Certification (Phase 11).
"""

from typing import Any, Dict
import os
import pytest
import numpy as np
import pandas as pd

from ml.src.validation.ml_scenario_validator import MLScenarioValidator
from ml.src.generation.anomalies import AnomalyType


@pytest.fixture(scope="module")
def validator() -> MLScenarioValidator:
    """Fixture providing an instantiated MLScenarioValidator."""
    return MLScenarioValidator(seed=42)


@pytest.fixture(scope="module")
def scenario_dataset(validator: MLScenarioValidator):
    """Fixture generating a fast, reproducible scenario dataset."""
    return validator.generate_scenario_dataset(
        n_normal_per_profile=10,
        n_anomalous_per_type=6,
    )


def test_scenario_dataset_generation(scenario_dataset):
    """Verify that scenario dataset contains balanced normal and anomalous cohorts."""
    users_df, tx_df, features_df = scenario_dataset

    # 3 normal profiles * 10 = 30 normal users
    # 5 anomaly types * 6 = 30 anomalous users
    assert len(users_df) == 60
    assert len(features_df) == 60
    assert not tx_df.empty

    normal_count = (users_df["is_anomalous"] == 0).sum()
    anom_count = (users_df["is_anomalous"] == 1).sum()
    assert normal_count == 30
    assert anom_count == 30

    # Ensure all 5 anomaly types are present in equal quantities
    anom_types = set(users_df[users_df["is_anomalous"] == 1]["anomaly_type"])
    assert len(anom_types) == 5
    for a_type in AnomalyType:
        assert a_type.value in anom_types


def test_ml_scenario_evaluation_metrics(validator: MLScenarioValidator, scenario_dataset):
    """Verify that ML intelligence pipeline achieves >= 85% recall and <= 10% FPR."""
    users_df, tx_df, features_df = scenario_dataset
    results = validator.evaluate_scenarios(users_df, tx_df, features_df)

    metrics = results["metrics"]
    assert metrics["recall"] >= 0.85, f"Recall {metrics['recall']} must be >= 0.85"
    assert metrics["false_positive_rate"] <= 0.10, f"FPR {metrics['false_positive_rate']} must be <= 0.10"
    assert metrics["precision"] >= 0.80, f"Precision {metrics['precision']} must be >= 0.80"
    assert metrics["f1_score"] >= 0.80, f"F1 {metrics['f1_score']} must be >= 0.80"


def test_scenario_breakdown_detection(validator: MLScenarioValidator, scenario_dataset):
    """Verify detection recall across each specific controlled anomaly type."""
    users_df, tx_df, features_df = scenario_dataset
    results = validator.evaluate_scenarios(users_df, tx_df, features_df)

    breakdown = results["scenario_breakdown"]

    # Normal users should have very low detection rate (FPR <= 0.10)
    assert breakdown["NONE"]["detection_rate"] <= 0.10

    # Every anomaly scenario should achieve high recall
    for a_type in AnomalyType:
        type_str = a_type.value
        assert type_str in breakdown
        det_rate = breakdown[type_str]["detection_rate"]
        assert det_rate >= 0.85, f"Anomaly {type_str} detection rate {det_rate} must be >= 0.85"


def test_noise_perturbation_robustness(validator: MLScenarioValidator, scenario_dataset):
    """Verify feature noise perturbation stability >= 85% at 5% and 10% sigma."""
    _, _, features_df = scenario_dataset
    robustness = validator.evaluate_noise_robustness(features_df)

    assert robustness["noise_sigma_5pct"]["label_stability_rate"] >= 0.85
    assert robustness["noise_sigma_5pct"]["status"] == "robust"

    assert robustness["noise_sigma_10pct"]["label_stability_rate"] >= 0.80
    assert robustness["noise_sigma_10pct"]["status"] == "robust"


def test_validation_report_generation(validator: MLScenarioValidator, tmp_path):
    """Verify end-to-end scenario validation report generation and passing criteria."""
    report_path = str(tmp_path / "test_report.json")
    report = validator.run_full_validation_suite(
        n_normal_per_profile=10,
        n_anomalous_per_type=6,
        output_path=report_path,
    )

    assert os.path.exists(report_path)
    assert report["validation_passed"] is True
    assert len(report["documented_limitations"]) >= 4
    assert report["benchmark_dataset"]["metrics"]["recall"] >= 0.85
    assert report["benchmark_dataset"]["metrics"]["false_positive_rate"] <= 0.10
