"""
Automated unit tests for Python Structured ML Output generator.
Verifies quantitative evidence, data quality scores, and parity with TypeScript contract.
"""

import pandas as pd
import pytest

from ml.src.export.ml_output_generator import generate_structured_ml_output


def test_empty_transactions_ml_output():
    """Verifies that empty transaction lists generate compliant fallback payloads."""
    output = generate_structured_ml_output([])

    assert output["schema_version"] == "1.0"
    assert output["period"] == "all-time"
    assert output["data_quality"]["transaction_count"] == 0
    assert output["data_quality"]["sufficient_data"] is False
    assert output["summary"]["total_income"] == 0.0
    assert output["summary"]["total_expense"] == 0.0
    assert output["insights"] == []


def test_category_increase_and_decline_insights():
    """Verifies evidence-backed category increase and decline insights."""
    transactions = [
        {"type": "income", "amount": 60000.0, "category": "Salary", "transaction_date": "2026-01-01"},
        {"type": "expense", "amount": 5000.0, "category": "Food", "transaction_date": "2026-01-10"},
        {"type": "expense", "amount": 10000.0, "category": "Shopping", "transaction_date": "2026-01-15"},
        {"type": "income", "amount": 60000.0, "category": "Salary", "transaction_date": "2026-02-01"},
        {"type": "expense", "amount": 12000.0, "category": "Food", "transaction_date": "2026-02-10"},  # +140%
        {"type": "expense", "amount": 2000.0, "category": "Shopping", "transaction_date": "2026-02-15"},  # -80%
    ] + [
        {"type": "expense", "amount": 500.0, "category": "Transport", "transaction_date": "2026-02-20"}
        for _ in range(6)
    ]

    output = generate_structured_ml_output(transactions, period="2026-02")

    assert output["period"] == "2026-02"
    assert output["data_quality"]["transaction_count"] == 12
    assert output["data_quality"]["sufficient_data"] is True

    types = [i["type"] for i in output["insights"]]
    assert "category_increase" in types
    assert "category_decline" in types

    growth_item = next(i for i in output["insights"] if i["type"] == "category_increase")
    assert growth_item["category"] == "Food"
    assert growth_item["evidence"]["observed_value"] == 12000.0
    assert growth_item["evidence"]["baseline_value"] == 5000.0


def test_anomaly_and_persona_integration():
    """Verifies anomaly detection context and persona badge inclusion."""
    transactions = [
        {"type": "expense", "amount": 2000.0, "category": "Shopping", "transaction_date": "2026-05-10"}
        for _ in range(15)
    ]

    anomaly_ctx = {
        "is_anomaly": True,
        "anomaly_score": 0.88,
        "severity": "critical",
        "contributing_features": [
            {"feature": "shopping_ratio", "value": 0.75, "baseline_mean": 0.168, "z_score": 3.45}
        ],
    }

    cluster_ctx = {
        "cluster_id": 3,
        "archetype": "Discretionary Overspender",
        "description": "High discretionary expenditure exceeding savings targets.",
        "confidence": 0.95,
    }

    output = generate_structured_ml_output(
        transactions,
        period="2026-05",
        anomaly_inference=anomaly_ctx,
        cluster_inference=cluster_ctx,
    )

    assert output["persona"] is not None
    assert output["persona"]["archetype"] == "Discretionary Overspender"
    assert output["persona"]["cluster_id"] == 3

    anomaly_insight = next(i for i in output["insights"] if i["type"] == "spending_anomaly")
    assert anomaly_insight["severity"] == "critical"
    assert anomaly_insight["score"] == 0.88
    assert anomaly_insight["evidence"]["metric_name"] == "shopping_ratio"
    assert anomaly_insight["evidence"]["z_score"] == 3.45
