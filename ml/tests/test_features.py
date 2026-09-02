"""
Automated unit and integration tests for Preprocessing and Feature Engineering.
"""

import datetime
import pytest
import pandas as pd
import numpy as np

from ml.src.preprocessing.preprocessor import TransactionPreprocessor
from ml.src.features.engineer import FeatureEngineer


@pytest.fixture
def sample_transactions():
    """Generates a small deterministic sample transaction history for a single user."""
    return [
        {
            "transaction_id": "txn_0001",
            "user_id": "user_101",
            "type": "income",
            "amount": 50000.0,
            "category": "Salary",
            "payment_method": "Bank Transfer",
            "transaction_date": "2026-01-01",
        },
        {
            "transaction_id": "txn_0002",
            "user_id": "user_101",
            "type": "expense",
            "amount": 2000.0,
            "category": "Food",
            "payment_method": "UPI",
            "transaction_date": "2026-01-03",  # Saturday -> weekend
        },
        {
            "transaction_id": "txn_0003",
            "user_id": "user_101",
            "type": "expense",
            "amount": 5000.0,
            "category": "Shopping",
            "payment_method": "Credit Card",
            "transaction_date": "2026-01-04",  # Sunday -> weekend
        },
        {
            "transaction_id": "txn_0004",
            "user_id": "user_101",
            "type": "expense",
            "amount": 3000.0,
            "category": "Bills",
            "payment_method": "Net Banking",
            "transaction_date": "2026-01-05",  # Monday -> weekday
        },
        {
            "transaction_id": "txn_0005",
            "user_id": "user_101",
            "type": "income",
            "amount": 50000.0,
            "category": "Salary",
            "payment_method": "Bank Transfer",
            "transaction_date": "2026-02-01",
        },
        {
            "transaction_id": "txn_0006",
            "user_id": "user_101",
            "type": "expense",
            "amount": 4000.0,
            "category": "Food",
            "payment_method": "UPI",
            "transaction_date": "2026-02-06",  # Friday -> weekend
        },
        {
            "transaction_id": "txn_0007",
            "user_id": "user_101",
            "type": "expense",
            "amount": 6000.0,
            "category": "Shopping",
            "payment_method": "Credit Card",
            "transaction_date": "2026-02-10",  # Tuesday -> weekday
        },
    ]


def test_preprocessor_transform(sample_transactions):
    """Tests temporal enrichment and chronological ordering."""
    preprocessor = TransactionPreprocessor()
    df = preprocessor.transform(sample_transactions)

    assert len(df) == 7
    assert "year_month" in df.columns
    assert "is_weekend" in df.columns
    assert "day_of_week" in df.columns

    # 2026-01-03 is Saturday (weekday = 5) -> weekend
    sat_row = df[df["transaction_id"] == "txn_0002"].iloc[0]
    assert bool(sat_row["is_weekend"]) is True
    assert sat_row["day_of_week"] == 5

    # 2026-01-05 is Monday (weekday = 0) -> weekday
    mon_row = df[df["transaction_id"] == "txn_0004"].iloc[0]
    assert bool(mon_row["is_weekend"]) is False

    # Check chronological order
    dates = df["tx_datetime"].tolist()
    assert dates == sorted(dates)


def test_feature_engineer_determinism(sample_transactions):
    """Verifies that feature extraction is strictly deterministic bit-for-bit."""
    preprocessor = TransactionPreprocessor()
    df = preprocessor.transform(sample_transactions)

    engineer = FeatureEngineer()
    features_1 = engineer.extract_user_features(df)
    features_2 = engineer.extract_user_features(df)

    assert features_1 == features_2


def test_feature_engineer_mathematical_invariants(sample_transactions):
    """Validates mathematical correctness of calculated financial ratios and metrics."""
    preprocessor = TransactionPreprocessor()
    df = preprocessor.transform(sample_transactions)

    engineer = FeatureEngineer()
    features = engineer.extract_user_features(df)

    # Total income = 100,000 across 2 months => avg = 50,000
    assert features["average_monthly_income"] == 50000.0

    # Expenses: 2000 + 5000 + 3000 + 4000 + 6000 = 20,000 across 2 months => avg = 10,000
    assert features["average_monthly_expense"] == 10000.0

    # Savings rate = (50000 - 10000) / 50000 * 100 = 80%
    assert features["savings_rate"] == 80.0

    # Total expense = 20,000. Food = 6000 => 30%
    assert features["food_ratio"] == 0.30

    # Shopping = 11000 => 55%
    assert features["shopping_ratio"] == 0.55

    # Weekend expenses: 2000 (Sat) + 5000 (Sun) + 4000 (Fri) = 11,000 / 20,000 = 55%
    assert features["weekend_spending_ratio"] == 0.55

    # Largest transaction = 6000.0
    assert features["largest_transaction"] == 6000.0
    assert features["largest_transaction_ratio"] == 0.30

    # Counts
    assert features["number_of_expenses"] == 5.0
    assert features["number_of_income_transactions"] == 2.0


def test_feature_engineer_empty_edge_case():
    """Ensures empty transaction history produces safe fallback vector without NaN or crash."""
    engineer = FeatureEngineer()
    features = engineer.extract_user_features(pd.DataFrame())

    assert features["average_monthly_income"] == 0.0
    assert features["savings_rate"] == 0.0
    assert features["food_ratio"] == 0.0
    assert not any(np.isnan(v) for v in features.values())


def test_feature_engineer_zero_income_edge_case():
    """Ensures safe division when income is zero (negative/zero savings rate without division by zero)."""
    txs = [
        {
            "transaction_id": "txn_e1",
            "user_id": "user_no_income",
            "type": "expense",
            "amount": 2500.0,
            "category": "Food",
            "payment_method": "Cash",
            "transaction_date": "2026-01-10",
        }
    ]
    preprocessor = TransactionPreprocessor()
    df = preprocessor.transform(txs)

    engineer = FeatureEngineer()
    features = engineer.extract_user_features(df)

    assert features["average_monthly_income"] == 0.0
    assert features["average_monthly_expense"] == 2500.0
    assert features["savings_rate"] == 0.0
    assert features["food_ratio"] == 1.0


def test_feature_engineer_batch():
    """Verifies batch extraction on multiple users."""
    txs = [
        {
            "transaction_id": f"txn_{i}",
            "user_id": f"user_{i % 3}",
            "type": "expense" if i % 2 == 0 else "income",
            "amount": 1000.0 * (i + 1),
            "category": "Food" if i % 2 == 0 else "Salary",
            "payment_method": "UPI",
            "transaction_date": f"2026-01-{(i % 25) + 1:02d}",
        }
        for i in range(12)
    ]
    preprocessor = TransactionPreprocessor()
    df = preprocessor.transform(txs)

    engineer = FeatureEngineer()
    batch_df = engineer.extract_features_batch(df)

    assert len(batch_df) == 3
    assert set(batch_df["user_id"]) == {"user_0", "user_1", "user_2"}
    assert "savings_rate" in batch_df.columns
    assert "average_monthly_expense" in batch_df.columns
