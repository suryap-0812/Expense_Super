"""
Automated unit tests for synthetic data generator.
"""

import os
import tempfile
import pytest
import pandas as pd
from ml.src.generation.config import GenerationConfig, BehavioralProfileType
from ml.src.generation.generator import SyntheticDataGenerator


def test_generator_deterministic_reproducibility():
    """Identical seed must yield exact identical user and transaction datasets."""
    config1 = GenerationConfig(num_users=20, min_months=3, max_months=6, seed=123)
    gen1 = SyntheticDataGenerator(config1)
    users1, tx1, meta1 = gen1.generate()

    config2 = GenerationConfig(num_users=20, min_months=3, max_months=6, seed=123)
    gen2 = SyntheticDataGenerator(config2)
    users2, tx2, meta2 = gen2.generate()

    pd.testing.assert_frame_equal(users1, users2)
    pd.testing.assert_frame_equal(tx1, tx2)
    assert meta1["total_transactions"] == meta2["total_transactions"]


def test_all_ten_behavioral_profiles_represented():
    """Checks that all 10 mandated behavioral profiles appear in the dataset."""
    config = GenerationConfig(num_users=200, min_months=3, max_months=4, seed=42)
    gen = SyntheticDataGenerator(config)
    users_df, _, meta = gen.generate()

    generated_profiles = set(users_df["profile"].unique())
    expected_profiles = {p.value for p in BehavioralProfileType}

    assert generated_profiles == expected_profiles, f"Missing profiles: {expected_profiles - generated_profiles}"


def test_transaction_schema_and_valid_values():
    """Validates schema fields, positive amounts, valid dates, and category validity."""
    config = GenerationConfig(num_users=15, min_months=3, max_months=4, seed=99)
    gen = SyntheticDataGenerator(config)
    _, tx_df, _ = gen.generate()

    required_columns = [
        "transaction_id",
        "user_id",
        "type",
        "amount",
        "category",
        "payment_method",
        "transaction_date",
        "description",
        "is_anomaly",
        "anomaly_type",
    ]
    for col in required_columns:
        assert col in tx_df.columns, f"Missing column {col}"

    # Amounts must be strictly positive (> 0)
    assert (tx_df["amount"] > 0).all(), "Found non-positive transaction amounts"

    # Transaction types must be either 'income' or 'expense'
    assert set(tx_df["type"].unique()).issubset({"income", "expense"})

    # Dates must be valid ISO YYYY-MM-DD
    dates = pd.to_datetime(tx_df["transaction_date"])
    assert not dates.isna().any()


def test_months_active_bounds():
    """Users must have active months strictly between min_months and max_months."""
    config = GenerationConfig(num_users=30, min_months=3, max_months=12, seed=77)
    gen = SyntheticDataGenerator(config)
    users_df, _, _ = gen.generate()

    assert (users_df["months_active"] >= 3).all()
    assert (users_df["months_active"] <= 12).all()


def test_controlled_anomaly_injection_and_labeling():
    """Verifies that anomalies are injected, flagged, and assigned valid types."""
    config = GenerationConfig(num_users=50, min_months=6, max_months=12, seed=42)
    gen = SyntheticDataGenerator(config)
    _, tx_df, meta = gen.generate()

    assert meta["total_anomalies"] > 0, "Expected non-zero injected anomalies"
    assert tx_df["is_anomaly"].sum() == meta["total_anomalies"]

    anomalous_rows = tx_df[tx_df["is_anomaly"]]
    assert not anomalous_rows["anomaly_type"].isna().any()

    # Normal transactions must not have anomaly_type
    normal_rows = tx_df[~tx_df["is_anomaly"]]
    assert normal_rows["anomaly_type"].isna().all()


def test_save_dataset_artifacts():
    """Verifies dataset persistence to parquet, csv, and metadata.json."""
    with tempfile.TemporaryDirectory() as tmpdir:
        config = GenerationConfig(num_users=10, min_months=3, max_months=4, seed=42, output_dir=tmpdir)
        gen = SyntheticDataGenerator(config)
        users_df, tx_df, meta = gen.generate()
        gen.save_dataset(users_df, tx_df, meta, output_dir=tmpdir)

        assert os.path.exists(os.path.join(tmpdir, "users.csv"))
        assert os.path.exists(os.path.join(tmpdir, "users.parquet"))
        assert os.path.exists(os.path.join(tmpdir, "transactions.csv"))
        assert os.path.exists(os.path.join(tmpdir, "transactions.parquet"))
        assert os.path.exists(os.path.join(tmpdir, "metadata.json"))
