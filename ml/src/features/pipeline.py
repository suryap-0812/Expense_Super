"""
Feature Engineering Pipeline
End-to-end execution: raw transactions -> preprocessing -> aggregations -> behavioral features.
(Section 64 of the Master Prompt).
"""

import argparse
import datetime
import json
import os
from typing import Optional
import numpy as np
import pandas as pd

from ml.src.preprocessing.preprocessor import TransactionPreprocessor
from ml.src.features.engineer import FeatureEngineer


def run_pipeline(
    raw_data_dir: str = "ml/data/raw",
    processed_data_dir: str = "ml/data/processed",
    features_data_dir: str = "ml/data/features",
) -> str:
    """Executes the complete deterministic feature engineering pipeline."""
    raw_tx_path = os.path.join(raw_data_dir, "transactions.parquet")
    raw_users_path = os.path.join(raw_data_dir, "users.parquet")

    if not os.path.exists(raw_tx_path):
        raw_tx_path = os.path.join(raw_data_dir, "transactions.csv")
    if not os.path.exists(raw_users_path):
        raw_users_path = os.path.join(raw_data_dir, "users.csv")

    if not os.path.exists(raw_tx_path) or not os.path.exists(raw_users_path):
        raise FileNotFoundError(f"Raw dataset files missing in '{raw_data_dir}'")

    print(f"[1/4] Loading raw transactions from '{raw_tx_path}'...")
    if raw_tx_path.endswith(".parquet"):
        raw_tx = pd.read_parquet(raw_tx_path)
    else:
        raw_tx = pd.read_csv(raw_tx_path)

    print(f"[2/4] Preprocessing {len(raw_tx)} transactions...")
    preprocessor = TransactionPreprocessor()
    processed_tx = preprocessor.transform(raw_tx)

    os.makedirs(processed_data_dir, exist_ok=True)
    proc_output = os.path.join(processed_data_dir, "transactions_processed.parquet")
    processed_tx.to_parquet(proc_output, index=False)
    print(f"      Preprocessed transactions saved to '{proc_output}'")

    print("[3/4] Extracting behavioral feature matrix across all users...")
    engineer = FeatureEngineer()
    feature_df = engineer.extract_features_batch(processed_tx)

    # Attach user ground-truth profile for downstream evaluation
    if raw_users_path.endswith(".parquet"):
        users_df = pd.read_parquet(raw_users_path)
    else:
        users_df = pd.read_csv(raw_users_path)

    if "profile" in users_df.columns:
        feature_df = pd.merge(
            feature_df,
            users_df[["user_id", "profile", "months_active"]],
            on="user_id",
            how="left",
        )

    print(f"[4/4] Saving feature representations for {len(feature_df)} users...")
    os.makedirs(features_data_dir, exist_ok=True)
    features_parquet = os.path.join(features_data_dir, "user_features.parquet")
    features_csv = os.path.join(features_data_dir, "user_features.csv")

    feature_df.to_parquet(features_parquet, index=False)
    feature_df.to_csv(features_csv, index=False)

    # Generate metadata report
    feature_columns = [
        c for c in feature_df.columns if c not in ["user_id", "profile", "months_active"]
    ]
    feature_stats = {}
    for col in feature_columns:
        feature_stats[col] = {
            "mean": round(float(feature_df[col].mean()), 4),
            "std": round(float(feature_df[col].std()), 4),
            "min": round(float(feature_df[col].min()), 4),
            "max": round(float(feature_df[col].max()), 4),
            "median": round(float(feature_df[col].median()), 4),
        }

    metadata = {
        "schema_version": "1.0",
        "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "total_users": len(feature_df),
        "total_features": len(feature_columns),
        "feature_list": feature_columns,
        "feature_statistics": feature_stats,
    }

    meta_path = os.path.join(features_data_dir, "feature_metadata.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"      Features saved to '{features_parquet}'")
    print(f"      Metadata saved to '{meta_path}'")
    print(">>> FEATURE ENGINEERING PIPELINE COMPLETED SUCCESSFULLY! <<<")
    return features_parquet


def main():
    parser = argparse.ArgumentParser(description="Run Feature Engineering Pipeline.")
    parser.add_argument("--raw-dir", type=str, default="ml/data/raw")
    parser.add_argument("--processed-dir", type=str, default="ml/data/processed")
    parser.add_argument("--features-dir", type=str, default="ml/data/features")
    args = parser.parse_args()

    run_pipeline(
        raw_data_dir=args.raw_dir,
        processed_data_dir=args.processed_dir,
        features_data_dir=args.features_dir,
    )


if __name__ == "__main__":
    main()
