"""
Automated unit and integration tests for dataset validation engine.
"""

import os
import tempfile
import pytest
from ml.src.generation.config import GenerationConfig
from ml.src.generation.generator import SyntheticDataGenerator
from ml.src.validation.dataset_validator import DatasetValidator


def test_validator_on_synthetic_data():
    """Runs the validator on a generated multi-profile sample and asserts checks pass."""
    with tempfile.TemporaryDirectory() as tmpdir:
        # Generate 150 users covering all profiles
        config = GenerationConfig(num_users=150, min_months=3, max_months=5, seed=42, output_dir=tmpdir)
        gen = SyntheticDataGenerator(config)
        users_df, tx_df, meta = gen.generate()
        gen.save_dataset(users_df, tx_df, meta, output_dir=tmpdir)

        validator = DatasetValidator(data_dir=tmpdir)
        report = validator.validate()

        assert report["total_users"] == 150
        assert report["total_transactions"] > 0

        # Integrity checks
        assert report["checks"]["dataset_integrity"]["passed"] is True
        assert report["checks"]["dataset_integrity"]["metrics"]["missing_user_fields"] == 0
        assert report["checks"]["dataset_integrity"]["metrics"]["non_positive_amounts"] == 0

        # Category distributions
        assert report["checks"]["category_distributions"]["passed"] is True

        # Temporal behavior
        assert report["checks"]["temporal_behavior"]["passed"] is True

        # Anomaly scenarios
        assert report["checks"]["anomaly_scenarios"]["passed"] is True
        assert report["checks"]["anomaly_scenarios"]["metrics"]["anomaly_to_normal_ratio"] >= 2.0


def test_validator_detects_data_corruption():
    """Verifies that the validator accurately flags corrupted or invalid amounts."""
    with tempfile.TemporaryDirectory() as tmpdir:
        config = GenerationConfig(num_users=20, min_months=3, max_months=4, seed=42, output_dir=tmpdir)
        gen = SyntheticDataGenerator(config)
        users_df, tx_df, meta = gen.generate()

        # Inject negative amount (data corruption)
        tx_df.loc[0, "amount"] = -500.0
        gen.save_dataset(users_df, tx_df, meta, output_dir=tmpdir)

        validator = DatasetValidator(data_dir=tmpdir)
        report = validator.validate()

        assert report["checks"]["dataset_integrity"]["passed"] is False
        assert report["checks"]["dataset_integrity"]["metrics"]["non_positive_amounts"] == 1
        assert report["validation_passed"] is False
